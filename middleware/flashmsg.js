exports.flashErrorMessages = message => {
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  return message;
};
