package com.factory.MesApplication.exception;

import com.factory.MesApplication.entity.LotStatus;
import lombok.Getter;

@Getter
public class QuarantineBlockException extends RuntimeException {

    private final String lotId;
    private final LotStatus lotStatus;
    private final String poId;

    public QuarantineBlockException(String lotId, LotStatus lotStatus, String poId, String message) {
        super(message);
        this.lotId = lotId;
        this.lotStatus = lotStatus;
        this.poId = poId;
    }

    public QuarantineBlockException(String lotId, LotStatus lotStatus, String message) {
        this(lotId, lotStatus, null, message);
    }
}
