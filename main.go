package main

import (
	"log"
	"os"
	"time"

	"perdin-go/config"
	"perdin-go/handler"
	"perdin-go/middleware"
	"perdin-go/models"
	"perdin-go/repository"
	"perdin-go/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load Env & Connect DB
	godotenv.Load()
	config.ConnectDB()
	config.DB.AutoMigrate(&models.User{}, &models.City{}, &models.PerdinRequest{})

	// Setup Dependency Injection
	// Repositories
	userRepo := repository.NewUserRepository(config.DB)
	cityRepo := repository.NewCityRepository(config.DB)
	perdinRepo := repository.NewPerdinRepository(config.DB)

	// Services
	allowanceSvc := service.NewAllowanceService()
	perdinSvc := service.NewPerdinService(perdinRepo, userRepo, cityRepo, allowanceSvc)

	// Handlers
	authHandler := handler.NewAuthHandler(userRepo)
	cityHandler := handler.NewCityHandler(cityRepo)
	userHandler := handler.NewUserHandler(userRepo)
	perdinHandler := handler.NewPerdinHandler(perdinSvc)

	// Setup Gin Router
	router := gin.Default()

	// Konfigurasi CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Setup Routes
	api := router.Group("/api")
	{
		// PUBLIC ROUTES (Tanpa Token)
		api.POST("/auth/login", authHandler.Login)

		api.POST("/auth/logout", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "Logout berhasil"})
		})

		// PROTECTED ROUTES (Harus Login)
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// --- RUTE MASTER USER (Hanya ADMIN) ---
			userRoutes := protected.Group("/admin/users")
			userRoutes.Use(middleware.RequireRole("ADMIN"))
			{
				userRoutes.GET("", userHandler.GetAllUsers)
				userRoutes.POST("", userHandler.CreateUser)
			}

			// --- RUTE MASTER KOTA (ADMIN & DIVISI_SDM) ---
			cityRoutes := protected.Group("/cities")
			cityRoutes.GET("", cityHandler.GetAll)

			cityAdminRoutes := cityRoutes.Group("")
			cityAdminRoutes.Use(middleware.RequireRole("ADMIN", "DIVISI_SDM"))
			{
				cityRoutes.POST("", cityHandler.Create)
				cityRoutes.DELETE("/:id", cityHandler.Delete)
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
	router.Run(":" + port)
}
