package th.mfu.dto.response;

import th.mfu.entity.Reservation;

public class SeatDto {
    private Long id;
    private Long roomId;
    private String seatCode;
    private Integer xPosition;
    private Integer yPosition;
    private String podLabel;
    private String status;
    private String qrToken;
    private String tableType;
    private Integer groupTableId;
    private String groupTableName;
    private Integer groupCapacity;
    private CurrentSessionInfo currentSession;
    private Reservation currentReservation;

    public static class CurrentSessionInfo {
        private Long sessionId;
        private String userName;
        private String checkedInAt;
        private String expiresAt;
        private Long minutesRemaining;

        public CurrentSessionInfo() {}

        public CurrentSessionInfo(Long sessionId, String userName, String checkedInAt, String expiresAt, Long minutesRemaining) {
            this.sessionId = sessionId;
            this.userName = userName;
            this.checkedInAt = checkedInAt;
            this.expiresAt = expiresAt;
            this.minutesRemaining = minutesRemaining;
        }

        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public String getCheckedInAt() { return checkedInAt; }
        public void setCheckedInAt(String checkedInAt) { this.checkedInAt = checkedInAt; }
        public String getExpiresAt() { return expiresAt; }
        public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
        public Long getMinutesRemaining() { return minutesRemaining; }
        public void setMinutesRemaining(Long minutesRemaining) { this.minutesRemaining = minutesRemaining; }
    }

    public SeatDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getSeatCode() { return seatCode; }
    public void setSeatCode(String seatCode) { this.seatCode = seatCode; }
    public Integer getxPosition() { return xPosition; }
    public void setxPosition(Integer xPosition) { this.xPosition = xPosition; }
    public Integer getyPosition() { return yPosition; }
    public void setyPosition(Integer yPosition) { this.yPosition = yPosition; }
    public String getPodLabel() { return podLabel; }
    public void setPodLabel(String podLabel) { this.podLabel = podLabel; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getQrToken() { return qrToken; }
    public void setQrToken(String qrToken) { this.qrToken = qrToken; }
    public String getTableType() { return tableType; }
    public void setTableType(String tableType) { this.tableType = tableType; }
    public Integer getGroupTableId() { return groupTableId; }
    public void setGroupTableId(Integer groupTableId) { this.groupTableId = groupTableId; }
    public String getGroupTableName() { return groupTableName; }
    public void setGroupTableName(String groupTableName) { this.groupTableName = groupTableName; }
    public Integer getGroupCapacity() { return groupCapacity; }
    public void setGroupCapacity(Integer groupCapacity) { this.groupCapacity = groupCapacity; }
    public CurrentSessionInfo getCurrentSession() { return currentSession; }
    public void setCurrentSession(CurrentSessionInfo currentSession) { this.currentSession = currentSession; }
    public Reservation getCurrentReservation() { return currentReservation; }
    public void setCurrentReservation(Reservation currentReservation) { this.currentReservation = currentReservation; }
}

