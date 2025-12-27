// middleware/jsend.js

exports.success = (statusCode, result) => ({
    status: "success",
    data: {
        statusCode,
        result,
    },
});

exports.fail = (statusCode, result) => ({
    status: "fail",
    data: {
        statusCode,
        result,
    },
});

exports.error = (message) => ({
    status: "error",
    result: message,
    });
