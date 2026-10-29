package th.mfu;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import th.mfu.dto.request.QuickLoginRequest;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class OccupancyRoomIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void testGetHealth() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("UP")))
                .andExpect(jsonPath("$.data.totalSeats", is(54)));
    }

    @Test
    void testGetRoomMap() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/1/map"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalSeats", is(54)))
                .andExpect(jsonPath("$.data.seats", hasSize(54)));
    }

    @Test
    void testQuickLogin() throws Exception {
        QuickLoginRequest req = new QuickLoginRequest();
        req.setEmail("alex.chen@student.university.edu");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("alex.chen@student.university.edu")));
    }

    @Test
    void testAdminAnalytics() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.hourlyOccupancy", notNullValue()))
                .andExpect(jsonPath("$.data.podUtilization", notNullValue()));
    }

    @Test
    void testAdminUsageMetrics() throws Exception {
        mockMvc.perform(get("/api/v1/admin/usage-metrics?interval=daily"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.summary.totalUsers", greaterThan(0)))
                .andExpect(jsonPath("$.data.timeline", notNullValue()));
    }
}
