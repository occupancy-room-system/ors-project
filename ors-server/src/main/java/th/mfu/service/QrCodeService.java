package th.mfu.service;

public interface QrCodeService {
    String generateQrDataUrl(String content, int width, int height);
}

