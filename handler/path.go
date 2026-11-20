package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func pathID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, strconv.IntSize)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return 0, false
	}
	return uint(id), true
}
