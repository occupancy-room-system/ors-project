package th.mfu.dto.request;

public class SeatUpsertRequest {
    private String seatCode;
    private String podLabel;
    private String tableType = "INDIVIDUAL";
    private Integer groupTableId;
    private String groupTableName;
    private Integer groupCapacity;
    private String status = "AVAILABLE";
    private Integer xPosition = 1;
    private Integer yPosition = 1;
    private String qrToken;
    private Long roomId = 1L;

    public SeatUpsertRequest() {
    }

    public String getSeatCode() {
        return seatCode;
    }

    public void setSeatCode(String seatCode) {
        this.seatCode = seatCode;
    }

    public String getPodLabel() {
        return podLabel;
    }

    public void setPodLabel(String podLabel) {
        this.podLabel = podLabel;
    }

    public String getTableType() {
        return tableType;
    }

    public void setTableType(String tableType) {
        this.tableType = tableType;
    }

    public Integer getGroupTableId() {
        return groupTableId;
    }

    public void setGroupTableId(Integer groupTableId) {
        this.groupTableId = groupTableId;
    }

    public String getGroupTableName() {
        return groupTableName;
    }

    public void setGroupTableName(String groupTableName) {
        this.groupTableName = groupTableName;
    }

    public Integer getGroupCapacity() {
        return groupCapacity;
    }

    public void setGroupCapacity(Integer groupCapacity) {
        this.groupCapacity = groupCapacity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getxPosition() {
        return xPosition;
    }

    public void setxPosition(Integer xPosition) {
        this.xPosition = xPosition;
    }

    public Integer getyPosition() {
        return yPosition;
    }

    public void setyPosition(Integer yPosition) {
        this.yPosition = yPosition;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }
}

