export const convertNumberToTextTime = (number?: number) => {
  if (!number) {
    return "0";
  }

  const hours = number / 60 / 60;
  if (hours > 1) {
    return `${hours.toFixed(2)} giờ`;
  }

  const minutes = number / 60;
  if (minutes > 1) {
    return `${minutes.toFixed(2)} phút`;
  }

  return `${number} giây`;
};
