package th.mfu.dto.request;

public class QuickLoginRequest {
    private String email;
    private String password;

    public QuickLoginRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

