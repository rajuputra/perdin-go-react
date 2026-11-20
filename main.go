package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"perdin-go/config"
	"perdin-go/handler"
	"perdin-go/middleware"
	"perdin-go/models"
	"perdin-go/repository"
	"perdin-go/security"
	"perdin-go/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load Env & Connect DB
	godotenv.Load()
	jwt, err := security.NewJWT(os.Getenv("JWT_SECRET"))
	if err != nil {
		log.Fatal(err)
	}
	config.ConnectDB()
	if err := config.DB.AutoMigrate(&models.User{}, &models.City{}, &models.PerdinRequest{}, &models.Session{}); err != nil {
		log.Fatal("Migrasi database gagal:", err)
	}
	if len(os.Args) == 2 && os.Args[1] == "init-admin" {
		initAdmin()
		return
	}

	// Setup Dependency Injection
	// Repositories
	userRepo := repository.NewUserRepository(config.DB)
	cityRepo := repository.NewCityRepository(config.DB)
	perdinRepo := repository.NewPerdinRepository(config.DB)

	// Services
	allowanceSvc := service.NewAllowanceService()
	perdinSvc := service.NewPerdinService(perdinRepo, userRepo, cityRepo, allowanceSvc)

	// Handlers
	sessions := repository.NewSessionRepository(config.DB)
	authHandler := handler.NewAuthHandler(userRepo, sessions, jwt, os.Getenv("GIN_MODE") == gin.ReleaseMode)
	cityHandler := handler.NewCityHandler(cityRepo)
	userHandler := handler.NewUserHandler(userRepo)
	perdinHandler := handler.NewPerdinHandler(perdinSvc)

	// Setup Gin Router
	router := gin.Default()

	if err := router.SetTrustedProxies(nil); err != nil {
		log.Fatal(err)
	}

	// Setup Routes
	api := router.Group("/api")
	api.Use(func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		switch c.Request.Method {
		case http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch:
			if c.GetHeader("X-DinasFlow-Request") != "1" {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Header permintaan tidak valid"})
				return
			}
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64<<10)
		}
		c.Next()
	})
	api.GET("/health", func(c *gin.Context) {
		db, err := config.DB.DB()
		if err != nil || db.PingContext(c.Request.Context()) != nil {
			c.Status(http.StatusServiceUnavailable)
			return
		}
		c.Status(http.StatusNoContent)
	})
	{
		// PUBLIC ROUTES (Tanpa Token)
		api.POST("/auth/login", authHandler.Login)

		api.POST("/auth/logout", authHandler.Logout)

		// PROTECTED ROUTES (Harus Login)
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(jwt, sessions, handler.SessionCookie))
		{
			protected.GET("/auth/me", authHandler.Me)
			// --- RUTE MASTER USER (Hanya ADMIN) ---
			userRoutes := protected.Group("/admin/users")
			userRoutes.Use(middleware.RequireRole("ADMIN"))
			{
				userRoutes.GET("", userHandler.GetAllUsers)
				userRoutes.POST("", userHandler.CreateUser)
				userRoutes.PUT("/:id/role", userHandler.UpdateUser)
			}

			// --- RUTE MASTER KOTA (ADMIN & DIVISI_SDM) ---
			cityRoutes := protected.Group("/cities")
			cityRoutes.GET("", cityHandler.GetAll)

			cityAdminRoutes := cityRoutes.Group("")
			cityAdminRoutes.Use(middleware.RequireRole("ADMIN", "DIVISI_SDM"))
			{
				cityAdminRoutes.POST("", cityHandler.Create)
				cityAdminRoutes.PUT("/:id", cityHandler.Update)
				cityAdminRoutes.DELETE("/:id", cityHandler.Delete)
			}

			// --- RUTE PERDIN ---
			perdinRoutes := protected.Group("/perdin")

			// Khusus PEGAWAI
			perdinRoutes.POST("", middleware.RequireRole("PEGAWAI"), perdinHandler.SubmitPerdin)
			perdinRoutes.GET("/my-requests", middleware.RequireRole("PEGAWAI"), perdinHandler.GetMyHistory)

			// Khusus SDM
			perdinRoutes.GET("", middleware.RequireRole("DIVISI_SDM"), perdinHandler.GetAllPerdin)
			perdinRoutes.GET("/:id/detail", middleware.RequireRole("DIVISI_SDM"), perdinHandler.GetDetail)
			perdinRoutes.PUT("/:id/approve", middleware.RequireRole("DIVISI_SDM"), perdinHandler.Approve)
			perdinRoutes.PUT("/:id/reject", middleware.RequireRole("DIVISI_SDM"), perdinHandler.Reject)
		}
	}

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server Go berjalan di port %s", port)
	server := &http.Server{
		Addr: ":" + port, Handler: router,
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second,
		WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second,
	}
	log.Fatal(server.ListenAndServe())
}
