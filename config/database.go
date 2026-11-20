package config

import (
	"log"
	"net"
	"net/url"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	if port == "" {
		port = "5432"
	}
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}
	dsn := url.URL{Scheme: "postgres", User: url.UserPassword(user, password), Host: net.JoinHostPort(host, port), Path: "/" + dbName}
	dsn.RawQuery = url.Values{"sslmode": {sslMode}}.Encode()
	pgConfig, err := pgx.ParseConfig(dsn.String())
	if err != nil {
		log.Fatal("Konfigurasi PostgreSQL tidak valid")
	}
	pgConfig.RuntimeParams["timezone"] = "Asia/Jakarta"

	database, err := gorm.Open(postgres.New(postgres.Config{Conn: stdlib.OpenDB(*pgConfig)}), &gorm.Config{
		TranslateError: true,
		Logger: logger.New(log.Default(), logger.Config{
			LogLevel: logger.Warn, ParameterizedQueries: true, IgnoreRecordNotFoundError: true,
		}),
	})
	if err != nil {
		log.Fatal("Gagal koneksi ke database:", err)
	}

	DB = database
	log.Println("Berhasil terkoneksi ke PostgreSQL")
}
