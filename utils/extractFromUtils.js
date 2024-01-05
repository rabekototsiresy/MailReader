const getFrom = (fromText) => {
  const regex = /<([^>]+)>/;
  const match = fromText.match(regex);
  if (match) return match[1];
  return "";
};

module.exports = getFrom;
