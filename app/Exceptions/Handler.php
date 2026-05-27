<?php

namespace App\Exceptions;

use Throwable;
use App\Helpers\ApiResponse;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class Handler extends ExceptionHandler
{
    /**
     * The list of inputs that are never flashed to the session.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks.
     */
    public function register(): void
    {
        // Validation Error (422)
        $this->renderable(function (ValidationException $e, $request) {
            if ($request->expectsJson()) {
                return ApiResponse::error('Cannot process requests', $e->getMessage(), 422);
            }

            return ApiResponse::error(
                'Validation error',
                $e->errors(),
                422
            );
        });

        // Model Not Found (404)
        $this->renderable(function (ModelNotFoundException $e, $request) {
            if ($request->expectsJson()) {
                return ApiResponse::error('Route not found', $e->getMessage(), 404);
            }

            return ApiResponse::error(
                'Data not found',
                null,
                404
            );
        });

        // Route Not Found (404)
        $this->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->expectsJson()) {
                return ApiResponse::error('Route not found', $e->getMessage(), 404);
            }
            return ApiResponse::error(
                'Endpoint not found',
                null,
                404
            );
        });

        // General Error (500)
        $this->renderable(function (Throwable $e, $request) {
            if ($request->expectsJson()) {
                return ApiResponse::error('Server error', $e->getMessage(), 500);
            }
            return ApiResponse::error(
                'Server error',
                app()->isLocal() ? $e->getMessage() : null,
                500
            );
        });
    }
}
