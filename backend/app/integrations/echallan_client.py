"""e-Challan API integration client."""
import logging
from typing import Optional

logger = logging.getLogger("driveverse.integrations.echallan")


async def check_vehicle_challans(registration_number: str) -> Optional[list]:
    """
    Check pending challans for a vehicle via the e-Challan API.

    NOTE: The official e-Challan API (echallan.parivahan.gov.in) does not provide
    public API access for third-party applications. This client is prepared
    for integration when API access is obtained.
    """
    logger.warning(
        f"e-Challan API not available for {registration_number}. "
        "Official API requires government partnership."
    )
    return None
