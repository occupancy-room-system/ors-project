package th.mfu.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import th.mfu.dto.response.ApiResponse;
import th.mfu.dto.response.OccupancyMapResponse;
import th.mfu.dto.response.OccupancyMetricsResponse;
import th.mfu.entity.Room;
import th.mfu.service.RoomService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Room>>> getAllRooms() {
        List<Room> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/{roomId}/map")
    public ResponseEntity<ApiResponse<OccupancyMapResponse>> getRoomMap(@PathVariable Long roomId) {
        OccupancyMapResponse response = roomService.getRoomMap(roomId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{roomId}/occupancy")
    public ResponseEntity<ApiResponse<OccupancyMetricsResponse>> getRoomOccupancy(@PathVariable Long roomId) {
        OccupancyMetricsResponse response = roomService.getRoomOccupancy(roomId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

