package th.mfu.dto.request;

import jakarta.validation.constraints.NotBlank;

public class UserLoginRequest {

    private String usernameOrEmail;
    private String studentId;

    @NotBlank(message = "Password is required")
    private String password;

    public UserLoginRequest() {
    }

    public UserLoginRequest(String usernameOrEmail, String password) {
        this.usernameOrEmail = usernameOrEmail;
        this.studentId = usernameOrEmail;
        this.password = password;
    }

    public String getUsernameOrEmail() {
        return (usernameOrEmail != null && !usernameOrEmail.trim().isEmpty())
                ? usernameOrEmail
                : studentId;
    }

    public void setUsernameOrEmail(String usernameOrEmail) {
        this.usernameOrEmail = usernameOrEmail;
        if (this.studentId == null) {
            this.studentId = usernameOrEmail;
        }
    }

    public String getStudentId() {
        return (studentId != null && !studentId.trim().isEmpty())
                ? studentId
                : usernameOrEmail;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
        if (this.usernameOrEmail == null) {
            this.usernameOrEmail = studentId;
        }
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
