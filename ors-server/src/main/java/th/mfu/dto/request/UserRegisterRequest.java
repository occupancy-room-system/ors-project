package th.mfu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserRegisterRequest {

    @Size(max = 50, message = "Student ID / Username must not exceed 50 characters")
    private String username;

    private String studentId;

    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    private String fullName;

    private th.mfu.entity.Role role;

    public UserRegisterRequest() {
    }

    public UserRegisterRequest(String username, String email, String password, String fullName) {
        this.username = username;
        this.studentId = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    public String getUsername() {
        return (username != null && !username.trim().isEmpty()) ? username : studentId;
    }

    public void setUsername(String username) {
        this.username = username;
        if (this.studentId == null) {
            this.studentId = username;
        }
    }

    public String getStudentId() {
        return (studentId != null && !studentId.trim().isEmpty()) ? studentId : username;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
        if (this.username == null) {
            this.username = studentId;
        }
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public th.mfu.entity.Role getRole() {
        return role;
    }

    public void setRole(th.mfu.entity.Role role) {
        this.role = role;
    }
}
