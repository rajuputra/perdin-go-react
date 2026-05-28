package handler

import (
	"net/http"
	"perdin-go/dto"
	"perdin-go/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PerdinHandler struct {
	perdinService service.PerdinService
}

func NewPerdinHandler(ps service.PerdinService) *PerdinHandler {
	return &PerdinHandler{ps}
}

// [POST] /api/perdin (Untuk Pegawai)
func (h *PerdinHandler) SubmitPerdin(c *gin.Context) {
	var req dto.PerdinSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data tidak valid"})
		return
	}

	userId := c.MustGet("userId").(uint) // Ambil ID dari token JWT
	res, err := h.perdinService.SubmitPerdin(userId, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// [GET] /api/perdin/my-requests (Untuk Pegawai)
func (h *PerdinHandler) GetMyHistory(c *gin.Context) {
	userId := c.MustGet("userId").(uint)
	res, err := h.perdinService.GetPerdinHistoryByUser(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// [GET] /api/perdin (Untuk SDM)
func (h *PerdinHandler) GetAllPerdin(c *gin.Context) {
	status := c.Query("status") // Ambil query param ?status=PENDING
	var res []dto.PerdinResponse
	var err error

	if status != "" {
		res, err = h.perdinService.GetAllPerdinByStatus(status)
	} else {
		res, err = h.perdinService.GetAllPerdin()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// [GET] /api/perdin/:id/detail
func (h *PerdinHandler) GetDetail(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	res, err := h.perdinService.GetPerdinDetailWithCalculation(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// [PUT] /api/perdin/:id/approve
func (h *PerdinHandler) Approve(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	res, err := h.perdinService.ApprovePerdin(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// [PUT] /api/perdin/:id/reject
func (h *PerdinHandler) Reject(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	res, err := h.perdinService.RejectPerdin(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}
