package th.mfu.dto.request;

import jakarta.validation.constraints.Email;
import th.mfu.entity.Role;

public class UserUpdateRequest {

    @Email(message = "Email must be valid")
    private String email;

    private String fullName;

    private Role role;

    public UserUpdateRequest() {
    }

    public UserUpdateRequest(String email, String fullName, Role role) {
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
