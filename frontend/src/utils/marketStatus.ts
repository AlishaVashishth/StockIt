export function getMarketStatus() {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();

  const isWeekday = day >= 1 && day <= 5;
  const afterOpen = hours > 9 || (hours === 9 && minutes >= 15);
  const beforeClose = hours < 15 || (hours === 15 && minutes <= 30);

  const isOpen = isWeekday && afterOpen && beforeClose;

  return {
    isOpen,
    label: isOpen ? "Market Open" : "Market Closed",
    description: isOpen
      ? "Live prices updating"
      : "Simulation trading active • Orders execute at last traded price",
  };
}

