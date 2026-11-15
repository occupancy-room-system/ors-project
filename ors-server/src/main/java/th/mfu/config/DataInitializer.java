package th.mfu.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import th.mfu.entity.*;
import th.mfu.repository.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final ReservationRepository reservationRepository;
    private final OccupancySessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, RoomRepository roomRepository,
                           SeatRepository seatRepository, ReservationRepository reservationRepository,
                           OccupancySessionRepository sessionRepository, AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.seatRepository = seatRepository;
        this.reservationRepository = reservationRepository;
        this.sessionRepository = sessionRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String adminPass = passwordEncoder.encode("admin123");

        // 1. Ensure Default Admin Account (admin@gmail.com / admin123)
        User admin = userRepository.findByEmail("admin@gmail.com")
                .or(() -> userRepository.findByUsername("admin"))
                .or(() -> userRepository.findByEmail("admin@university.edu"))
                .orElse(null);

        if (admin == null) {
            admin = new User("admin", "admin@gmail.com", adminPass, "Administrator", Role.ADMINISTRATOR);
            admin = userRepository.save(admin);
        } else {
            admin.setUsername("admin");
            admin.setEmail("admin@gmail.com");
            admin.setPassword(adminPass);
            admin.setRole(Role.ADMINISTRATOR);
            admin.setAccountStatus("ACTIVE");
            admin = userRepository.save(admin);
        }

        // 2. Clean up legacy sample students and dummy session data if present
        List<User> sampleUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.ADMINISTRATOR && !"admin".equalsIgnoreCase(u.getUsername()))
                .toList();

        if (!sampleUsers.isEmpty()) {
            for (User su : sampleUsers) {
                sessionRepository.deleteAll(sessionRepository.findByUserIdOrderByCheckedInAtDesc(su.getId()));
                reservationRepository.deleteAll(reservationRepository.findByUserIdOrderByCreatedAtDesc(su.getId()));
            }
            userRepository.deleteAll(sampleUsers);
            System.out.println(">>> Cleared " + sampleUsers.size() + " sample users from previous runs.");
        }

        if (roomRepository.count() > 0) {
            roomRepository.findByRoomCode("SE-LAB-101").ifPresent(room -> {
                room.setName("SE Lab");
                room.setBuilding("SE Lab");
                roomRepository.save(room);
            });

            // Reset any orphaned occupied/reserved seats back to AVAILABLE
            List<Seat> seats = seatRepository.findAll();
            boolean updated = false;
            for (Seat seat : seats) {
                if ("OCCUPIED".equalsIgnoreCase(seat.getStatus()) || "RESERVED".equalsIgnoreCase(seat.getStatus()) || "EXPIRING_SOON".equalsIgnoreCase(seat.getStatus())) {
                    seat.setStatus("AVAILABLE");
                    updated = true;
                }
            }
            if (updated) {
                seatRepository.saveAll(seats);
            }
            System.out.println(">>> ORS Database ready with " + seatRepository.count() + " workstations and default admin: admin@gmail.com");
            return;
        }

        System.out.println(">>> Initializing ORS Database with baseline data in MySQL...");

        // 3. Seed Room
        Room room = roomRepository.findByRoomCode("SE-LAB-101")
                .orElseGet(() -> roomRepository.save(new Room(
                        "SE-LAB-101",
                        "SE Lab",
                        "Main undergraduate collaborative engineering workspace with 54 workstations: Stations A-E (Individual) and Group Tables 1-5 (Group Booking).",
                        "SE Lab",
                        1,
                        14,
                        10,
                        "ACTIVE"
                )));

        // 4. Seed 54 Workstation Seats
        List<Seat> seats = new ArrayList<>();

        // Station A (6 Individual Desks)
        int[][] stationACoords = {{2,2}, {3,2}, {4,2}, {2,3}, {3,3}, {4,3}};
        for (int i = 0; i < 6; i++) {
            String code = "SEAT-A" + (i + 1);
            String status = (i == 0) ? "RESERVED" : ((i == 2) ? "OCCUPIED" : "AVAILABLE");
            seats.add(new Seat(room, code, stationACoords[i][0], stationACoords[i][1], "Station A", "INDIVIDUAL", null, null, null, status, "QR-SELAB101-A" + (i + 1)));
        }

        // Station B (6 Individual Desks)
        int[][] stationBCoords = {{6,2}, {7,2}, {8,2}, {6,3}, {7,3}, {8,3}};
        for (int i = 0; i < 6; i++) {
            String code = "SEAT-B" + (i + 1);
            String status = (i == 4) ? "EXPIRING_SOON" : "AVAILABLE";
            seats.add(new Seat(room, code, stationBCoords[i][0], stationBCoords[i][1], "Station B", "INDIVIDUAL", null, null, null, status, "QR-SELAB101-B" + (i + 1)));
        }

        // Group Table 1 (2 Desks)
        seats.add(new Seat(room, "SEAT-GT1-1", 10, 2, "Group Table 1", "GROUP", 1, "Group Table 1", 2, "AVAILABLE", "QR-SELAB101-GT1-1"));
        seats.add(new Seat(room, "SEAT-GT1-2", 10, 3, "Group Table 1", "GROUP", 1, "Group Table 1", 2, "AVAILABLE", "QR-SELAB101-GT1-2"));

        // Group Table 2 (9 Desks)
        int[][] gt2Coords = {{12,1}, {13,1}, {12,2}, {13,2}, {12,3}, {13,3}, {12,4}, {13,4}, {12,5}};
        for (int i = 0; i < 9; i++) {
            seats.add(new Seat(room, "SEAT-GT2-" + (i + 1), gt2Coords[i][0], gt2Coords[i][1], "Group Table 2", "GROUP", 2, "Group Table 2", 9, "AVAILABLE", "QR-SELAB101-GT2-" + (i + 1)));
        }

        // Group Table 3 (9 Desks)
        int[][] gt3Coords = {{12,6}, {13,6}, {12,7}, {13,7}, {12,8}, {13,8}, {12,9}, {13,9}, {12,10}};
        for (int i = 0; i < 9; i++) {
            seats.add(new Seat(room, "SEAT-GT3-" + (i + 1), gt3Coords[i][0], gt3Coords[i][1], "Group Table 3", "GROUP", 3, "Group Table 3", 9, "AVAILABLE", "QR-SELAB101-GT3-" + (i + 1)));
        }

        // Station C (4 Individual Desks)
        int[][] stationCCoords = {{2,5}, {3,5}, {2,6}, {3,6}};
        for (int i = 0; i < 4; i++) {
            String status = (i == 3) ? "MAINTENANCE" : "AVAILABLE";
            seats.add(new Seat(room, "SEAT-C" + (i + 1), stationCCoords[i][0], stationCCoords[i][1], "Station C", "INDIVIDUAL", null, null, null, status, "QR-SELAB101-C" + (i + 1)));
        }

        // Station D (4 Individual Desks)
        int[][] stationDCoords = {{5,5}, {6,5}, {5,6}, {6,6}};
        for (int i = 0; i < 4; i++) {
            seats.add(new Seat(room, "SEAT-D" + (i + 1), stationDCoords[i][0], stationDCoords[i][1], "Station D", "INDIVIDUAL", null, null, null, "AVAILABLE", "QR-SELAB101-D" + (i + 1)));
        }

        // Station E (2 Individual Desks)
        seats.add(new Seat(room, "SEAT-E1", 8, 5, "Station E", "INDIVIDUAL", null, null, null, "AVAILABLE", "QR-SELAB101-E1"));
        seats.add(new Seat(room, "SEAT-E2", 9, 5, "Station E", "INDIVIDUAL", null, null, null, "AVAILABLE", "QR-SELAB101-E2"));

        // Group Table 4 (6 Desks)
        int[][] gt4Coords = {{2,8}, {3,8}, {4,8}, {2,9}, {3,9}, {4,9}};
        for (int i = 0; i < 6; i++) {
            seats.add(new Seat(room, "SEAT-GT4-" + (i + 1), gt4Coords[i][0], gt4Coords[i][1], "Group Table 4", "GROUP", 4, "Group Table 4", 6, "AVAILABLE", "QR-SELAB101-GT4-" + (i + 1)));
        }

        // Group Table 5 (6 Desks)
        int[][] gt5Coords = {{6,8}, {7,8}, {8,8}, {6,9}, {7,9}, {8,9}};
        for (int i = 0; i < 6; i++) {
            seats.add(new Seat(room, "SEAT-GT5-" + (i + 1), gt5Coords[i][0], gt5Coords[i][1], "Group Table 5", "GROUP", 5, "Group Table 5", 6, "AVAILABLE", "QR-SELAB101-GT5-" + (i + 1)));
        }

        seatRepository.saveAll(seats);

        auditLogRepository.save(new AuditLog(
                admin.getId(),
                "SYSTEM_INITIALIZATION",
                "SYSTEM",
                "1",
                "{\"note\":\"Database initialized with default administrator (admin@gmail.com), 1 room, and 54 workstations.\"}"
        ));

        System.out.println(">>> ORS Database initialized successfully with 54 workstations and default admin: admin@gmail.com");
    }
}
