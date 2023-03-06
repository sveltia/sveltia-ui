export const getRandomId = (prefix = '', length = 7) =>
  [
    prefix,
    new Array(length)
      .fill()
      .map(() => '0123456789abcdef'[Math.floor(Math.random() * 12)])
      .join(''),
  ].join('-');
