<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureUrlGenerator();
    }

    /**
     * Root da aplicação para geração de URLs.
     *
     * Com APP_PATH_PREFIX=pei2 as rotas já incluem /pei2. O APP_URL deve ser só
     * o host (https://technologyhm.com.br). Se APP_URL vier com /pei2 no final,
     * removemos para não gerar /pei2/pei2 (404).
     */
    protected function configureUrlGenerator(): void
    {
        $root = rtrim((string) config('app.url'), '/');
        $prefix = trim((string) config('app.path_prefix'), '/');

        if ($prefix !== '' && str_ends_with($root, '/'.$prefix)) {
            $root = substr($root, 0, -strlen('/'.$prefix));
        }

        if ($root !== '') {
            URL::forceRootUrl($root);
        }

        if (str_starts_with($root, 'https://')) {
            URL::forceScheme('https');
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
