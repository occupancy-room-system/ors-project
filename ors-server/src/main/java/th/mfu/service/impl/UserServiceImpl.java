package th.mfu.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import th.mfu.dto.request.UserRegisterRequest;
import th.mfu.dto.request.UserUpdateRequest;
import th.mfu.dto.response.UserResponse;
import th.mfu.entity.OccupancySession;
import th.mfu.entity.Reservation;
import th.mfu.entity.User;
import th.mfu.exception.BadRequestException;
import th.mfu.exception.ResourceNotFoundException;
import th.mfu.repository.OccupancySessionRepository;
import th.mfu.repository.ReservationRepository;
import th.mfu.repository.SeatRepository;
import th.mfu.repository.UserRepository;
import th.mfu.service.UserService;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final OccupancySessionRepository occupancySessionRepository;
    private final ReservationRepository reservationRepository;
    private final SeatRepository seatRepository;

    public UserServiceImpl(
            UserRepository userRepository,
            OccupancySessionRepository occupancySessionRepository,
            ReservationRepository reservationRepository,
            SeatRepository seatRepository) {
        this.userRepository = userRepository;
        this.occupancySessionRepository = occupancySessionRepository;
        this.reservationRepository = reservationRepository;
        this.seatRepository = seatRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(UserRegisterRequest request) {
        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            throw new BadRequestException("Student ID / Username is required");
        }
        String cleanUsername = username.trim();
        if (userRepository.existsByUsername(cleanUsername)) {
            throw new BadRequestException("User with Student ID / Username '" + cleanUsername + "' already exists");
        }

        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = cleanUsername.toLowerCase() + "@student.university.edu";
        }
        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("Email '" + cleanEmail + "' is already in use");
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank()
                ? request.getPassword()
                : "StudentPass123!";

        Role role = request.getRole() != null ? request.getRole() : Role.STUDENT;
        String fullName = request.getFullName() != null && !request.getFullName().isBlank()
                ? request.getFullName().trim()
                : cleanUsername;

        User user = new User(cleanUsername, cleanEmail, passwordEncoder.encode(rawPassword), fullName, role);
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.getEmail() != null && !request.getEmail().trim().equalsIgnoreCase(user.getEmail())) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (userRepository.existsByEmail(newEmail)) {
                throw new BadRequestException("Email '" + newEmail + "' is already in use");
            }
            user.setEmail(newEmail);
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        User updatedUser = userRepository.save(user);
        return UserResponse.fromEntity(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }

        // 1. Clean up user's occupancy sessions & free any active workstation
        List<OccupancySession> sessions = occupancySessionRepository.findByUserIdOrderByCheckedInAtDesc(id);
        for (OccupancySession session : sessions) {
            if ("ACTIVE".equalsIgnoreCase(session.getStatus())) {
                seatRepository.findById(session.getSeatId()).ifPresent(seat -> {
                    seat.setStatus("AVAILABLE");
                    seatRepository.save(seat);
                });
            }
        }
        occupancySessionRepository.deleteAll(sessions);

        // 2. Clean up user's reservations & free any active reserved seats
        List<Reservation> reservations = reservationRepository.findByUserIdOrderByCreatedAtDesc(id);
        for (Reservation res : reservations) {
            if ("ACTIVE".equalsIgnoreCase(res.getStatus()) && res.getSeatId() != null) {
                seatRepository.findById(res.getSeatId()).ifPresent(seat -> {
                    seat.setStatus("AVAILABLE");
                    seatRepository.save(seat);
                });
            }
        }
        reservationRepository.deleteAll(reservations);

        // 3. Delete user record
        userRepository.deleteById(id);
    }
}
