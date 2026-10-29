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
        if (roomRepository.count() > 0) {
            System.out.println(">>> ORS Database already initialized with " + seatRepository.count() + " workstations.");
            return;
        }

        System.out.println(">>> Initializing ORS Database with seed data in MySQL...");

        // 1. Seed Users idempotently
        List<User> users = new ArrayList<>();
        String adminPass = passwordEncoder.encode("AdminPass123!");
        String studentPass = passwordEncoder.encode("StudentPass123!");

        User admin = userRepository.findByUsername("admin")
                .or(() -> userRepository.findByEmail("admin@university.edu"))
                .orElseGet(() -> userRepository.save(new User("admin", "admin@university.edu", adminPass, "Prof. Robert Vance (Admin)", Role.ADMINISTRATOR)));
        users.add(admin);

        String[][] studentsData = {
                {"alex.chen", "alex.chen@student.university.edu", "Alex Chen (Student)"},
                {"sarah.kim", "sarah.kim@student.university.edu", "Sarah Kim (Student)"},
                {"marcus.taylor", "marcus.taylor@student.university.edu", "Marcus Taylor (Student)"},
                {"emily.zhao", "emily.zhao@student.university.edu", "Emily Zhao (Student)"},
                {"david.wong", "david.wong@student.university.edu", "David Wong (Student)"},
                {"lisa.tanaka", "lisa.tanaka@student.university.edu", "Lisa Tanaka (Student)"},
                {"james.rodriguez", "james.rodriguez@student.university.edu", "James Rodriguez (Student)"},
                {"priya.patel", "priya.patel@student.university.edu", "Priya Patel (Student)"},
                {"daniel.lee", "daniel.lee@student.university.edu", "Daniel Lee (Student)"},
                {"chloe.dupont", "chloe.dupont@student.university.edu", "Chloe Dupont (Student)"},
                {"ethan.brown", "ethan.brown@student.university.edu", "Ethan Brown (Student)"},
                {"sophia.martinez", "sophia.martinez@student.university.edu", "Sophia Martinez (Student)"},
                {"liam.wilson", "liam.wilson@student.university.edu", "Liam Wilson (Student)"},
                {"olivia.davis", "olivia.davis@student.university.edu", "Olivia Davis (Student)"}
        };

        for (String[] s : studentsData) {
            final String username = s[0];
            final String email = s[1];
            final String fullName = s[2];
            User u = userRepository.findByUsername(username)
                    .or(() -> userRepository.findByEmail(email))
                    .orElseGet(() -> userRepository.save(new User(username, email, studentPass, fullName, Role.STUDENT)));
            users.add(u);
        }

        // 2. Seed Room
        Room room = roomRepository.findByRoomCode("SE-LAB-101")
                .orElseGet(() -> roomRepository.save(new Room(
                        "SE-LAB-101",
                        "Software Engineering Innovation Lab",
                        "Main undergraduate collaborative engineering workspace with 54 workstations: Stations A-E (Individual) and Group Tables 1-5 (Group Booking).",
                        "Turing Hall of Computing",
                        1,
                        14,
                        10,
                        "ACTIVE"
                )));

        // 3. Seed 54 Workstation Seats
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

        List<Seat> savedSeats = seatRepository.saveAll(seats);

        // 4. Initial Reservations
        LocalDateTime now = LocalDateTime.now();
        Seat seatA1 = savedSeats.get(0);
        User studentAlex = users.get(1);

        Reservation initialResv = new Reservation();
        initialResv.setUserId(studentAlex.getId());
        initialResv.setUserName(studentAlex.getFullName());
        initialResv.setUserEmail(studentAlex.getEmail());
        initialResv.setSeatId(seatA1.getId());
        initialResv.setSeatCode(seatA1.getSeatCode());
        initialResv.setPodLabel(seatA1.getPodLabel());
        initialResv.setStartTime(now.plusMinutes(15));
        initialResv.setDurationHours(2);
        initialResv.setExpiresAt(now.plusMinutes(35));
        initialResv.setStatus("PENDING_ACTIVATION");
        reservationRepository.save(initialResv);

        // 5. Initial Active Sessions
        Seat seatA3 = savedSeats.get(2);
        User studentDavid = users.size() > 5 ? users.get(5) : users.get(0);
        OccupancySession session1 = new OccupancySession();
        session1.setUserId(studentDavid.getId());
        session1.setSeatId(seatA3.getId());
        session1.setCheckedInAt(now.minusMinutes(45));
        session1.setExpiresAt(now.plusMinutes(75));
        session1.setStatus("ACTIVE");
        sessionRepository.save(session1);

        Seat seatB5 = savedSeats.get(10);
        User studentMarcus = users.size() > 3 ? users.get(3) : users.get(0);
        OccupancySession session2 = new OccupancySession();
        session2.setUserId(studentMarcus.getId());
        session2.setSeatId(seatB5.getId());
        session2.setCheckedInAt(now.minusMinutes(110));
        session2.setExpiresAt(now.plusMinutes(10));
        session2.setStatus("ACTIVE");
        sessionRepository.save(session2);

        // 6. Seed 90 days of rich completed session history
        List<OccupancySession> historicalSessions = new ArrayList<>();
        List<Long> studentIds = users.stream().map(User::getId).toList();

        for (int daysAgo = 90; daysAgo >= 1; daysAgo--) {
            LocalDateTime dayBase = now.minusDays(daysAgo);
            int dayOfWeek = dayBase.getDayOfWeek().getValue();
            int count = (dayOfWeek >= 6) ? (2 + (daysAgo % 2)) : (4 + (daysAgo % 3));

            for (int idx = 0; idx < count; idx++) {
                Long studentId = studentIds.get((daysAgo * 3 + idx * 2) % studentIds.size());
                Seat s = savedSeats.get((daysAgo * 5 + idx * 7) % savedSeats.size());
                int startHour = 8 + (idx * 2) + ((daysAgo % 3));
                LocalDateTime start = dayBase.withHour(startHour).withMinute(15).withSecond(0);
                int durationMinutes = 45 + ((daysAgo * 11 + idx * 23) % 95);
                LocalDateTime end = start.plusMinutes(durationMinutes);

                OccupancySession pastSession = new OccupancySession();
                pastSession.setUserId(studentId);
                pastSession.setSeatId(s.getId());
                pastSession.setCheckedInAt(start);
                pastSession.setExpiresAt(end);
                pastSession.setCheckedOutAt(end);
                pastSession.setStatus("CHECKED_OUT");
                historicalSessions.add(pastSession);
            }
        }
        sessionRepository.saveAll(historicalSessions);

        auditLogRepository.save(new AuditLog(
                admin.getId(),
                "SYSTEM_INITIALIZATION",
                "SYSTEM",
                "1",
                "{\"note\":\"Database initialized with users, 1 room, 54 workstations, and 90 days of historical sessions.\"}"
        ));

        System.out.println(">>> ORS Database initialized successfully with 54 workstations!");
    }
}
