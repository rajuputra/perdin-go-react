package main

import (
	"bufio"
	"log"
	"os"
	"strings"

	"perdin-go/config"
	"perdin-go/models"
	"perdin-go/repository"
	"perdin-go/security"
)

func initAdmin() {
	username := strings.TrimSpace(os.Getenv("ADMIN_USERNAME"))
	reader := bufio.NewScanner(os.Stdin)
	if username == "" || len(username) > 100 || !reader.Scan() {
		log.Fatal("Tetapkan ADMIN_USERNAME dan berikan kata sandi melalui stdin")
	}
	password := reader.Text()
	if len(password) < 12 || len(password) > 72 {
		log.Fatal("Kata sandi harus terdiri dari 12–72 byte")
	}
	hash, err := security.HashPassword(password)
	if err != nil {
		log.Fatal("Gagal memproses kata sandi")
	}
	if err := repository.NewUserRepository(config.DB).BootstrapAdmin(models.User{Username: username, Password: hash, Role: "ADMIN"}); err != nil {
		log.Fatal("Admin awal gagal dibuat:", err)
	}
	log.Print("Admin awal berhasil dibuat")
}
