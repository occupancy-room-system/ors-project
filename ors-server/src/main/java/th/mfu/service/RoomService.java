package th.mfu.service;

import th.mfu.dto.response.OccupancyMapResponse;
import th.mfu.dto.response.OccupancyMetricsResponse;
import th.mfu.entity.Room;

import java.util.List;

public interface RoomService {
    List<Room> getAllRooms();
    OccupancyMapResponse getRoomMap(Long roomId);
    OccupancyMetricsResponse getRoomOccupancy(Long roomId);
}

