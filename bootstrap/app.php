<?php

use App\Helpers\ApiResponse;
use GuzzleHttp\Psr7\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\ForceJsonResponse::class
        ]);
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (
            Illuminate\Auth\AuthenticationException $e,
            Illuminate\Http\Request $request
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'errors' => null,
            ], 401);
        });

        // Validation (422)
        $exceptions->render(function (ValidationException $e, $request) {
            return ApiResponse::error('Validation error', $e->errors(), 422);
        });

        // Model not found (404)
        $exceptions->render(function (ModelNotFoundException $e, $request) {
            return ApiResponse::error('Data not found', null, 404);
        });

        // Route / model binding not found (404)
        $exceptions->render(function (NotFoundHttpException $e, $request) {
            return ApiResponse::error('Endpoint or data not found', null, 404);
        });

        // General error (500)
        $exceptions->render(function (Throwable $e, $request) {
            return ApiResponse::error(
                'Server error',
                app()->isLocal() ? $e->getMessage() : null,
                500
            );
        });
    })->create();
