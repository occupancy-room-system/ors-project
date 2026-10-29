package th.mfu.dto.response;

import th.mfu.entity.Seat;

public class QrCodeItemResponse {
    private Seat seat;
    private String qrDataUrl;
    private String qrUrl;

    public QrCodeItemResponse() {}

    public QrCodeItemResponse(Seat seat, String qrDataUrl, String qrUrl) {
        this.seat = seat;
        this.qrDataUrl = qrDataUrl;
        this.qrUrl = qrUrl;
    }

    public Seat getSeat() { return seat; }
    public void setSeat(Seat seat) { this.seat = seat; }
    public String getQrDataUrl() { return qrDataUrl; }
    public void setQrDataUrl(String qrDataUrl) { this.qrDataUrl = qrDataUrl; }
    public String getQrUrl() { return qrUrl; }
    public void setQrUrl(String qrUrl) { this.qrUrl = qrUrl; }
}

