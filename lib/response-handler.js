function handleSuccess(res, data, message = 'Success') {
  res.status(200).json({
    status: 'success',
    data: data,
    message: message,
  });
}

// Error handling will be centralized
module.exports = { handleSuccess };