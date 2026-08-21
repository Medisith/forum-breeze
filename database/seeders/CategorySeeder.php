<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Seed the forum categories.
     */
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'problemas-ambientais-locais',
                'name' => 'Problemas Ambientais Locais',
                'description' => 'Denúncias, relatos e discussões sobre questões ambientais específicas da nossa região.',
            ],
            [
                'slug' => 'sustentabilidade',
                'name' => 'Sustentabilidade',
                'description' => 'Práticas, ideias e projetos para reduzir impacto ambiental e promover consumo consciente.',
            ],
            [
                'slug' => 'materiais-educativos',
                'name' => 'Materiais Educativos',
                'description' => 'Compartilhamento de guias, vídeos, artigos e recursos para aprendizado sobre meio ambiente.',
            ],
            [
                'slug' => 'propostas-de-melhoria',
                'name' => 'Propostas de Melhoria',
                'description' => 'Sugestões concretas para melhorar políticas públicas, infraestrutura e o próprio fórum.',
            ],
            [
                'slug' => 'desenvolvimento-social',
                'name' => 'Desenvolvimento Social',
                'description' => 'Iniciativas comunitárias, projetos sociais e ações de impacto coletivo na região.',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                ],
            );
        }
    }
}
