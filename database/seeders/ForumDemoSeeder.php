<?php

namespace Database\Seeders;

use App\Enums\TopicType;
use App\Models\Category;
use App\Models\Post;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Seeder;

class ForumDemoSeeder extends Seeder
{
    /**
     * Seed demo forum content (admin user, topics, posts).
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@forum.test'],
            [
                'name' => 'Admin Demo',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        $categories = Category::query()
            ->whereIn('slug', [
                'problemas-ambientais-locais',
                'sustentabilidade',
                'materiais-educativos',
                'propostas-de-melhoria',
                'desenvolvimento-social',
            ])
            ->get()
            ->keyBy('slug');

        $topics = [
            [
                'category' => 'problemas-ambientais-locais',
                'title' => 'Descarte irregular de lixo no bairro Centro',
                'body' => 'Há semanas observamos entulho e resíduos acumulados próximo à praça principal. Alguém já registrou ocorrência na prefeitura?',
                'type' => TopicType::Discussao,
            ],
            [
                'category' => 'problemas-ambientais-locais',
                'title' => 'Qualidade da água do rio após chuvas',
                'body' => 'Após as últimas chuvas, a cor e o odor da água mudaram. Propomos monitoramento comunitário semanal.',
                'type' => TopicType::Sugestao,
            ],
            [
                'category' => 'sustentabilidade',
                'title' => 'Compostagem doméstica: guia para iniciantes',
                'body' => 'Compartilho passo a passo para montar uma composteira simples em apartamentos e casas.',
                'type' => TopicType::Material,
            ],
            [
                'category' => 'sustentabilidade',
                'title' => 'Proposta: horta comunitária no terreno baldio',
                'body' => 'Temos um terreno ocioso na Rua das Acácias. Sugerimos transformá-lo em horta com produção compartilhada.',
                'type' => TopicType::Proposta,
            ],
            [
                'category' => 'materiais-educativos',
                'title' => 'Cartilha sobre separação de resíduos',
                'body' => 'PDF gratuito da cooperativa local explicando recicláveis, orgânicos e rejeitos. Link nos comentários.',
                'type' => TopicType::Material,
            ],
            [
                'category' => 'materiais-educativos',
                'title' => 'Vídeos curtos sobre energia solar residencial',
                'body' => 'Curadoria de três vídeos introdutórios sobre painéis solares e payback para residências.',
                'type' => TopicType::Material,
            ],
            [
                'category' => 'propostas-de-melhoria',
                'title' => 'Mais lixeiras de coleta seletiva nas escolas',
                'body' => 'Sugestão de instalar pontos de coleta seletiva em todas as escolas municipais até o fim do ano.',
                'type' => TopicType::Sugestao,
            ],
            [
                'category' => 'propostas-de-melhoria',
                'title' => 'Calendário de mutirões de limpeza mensais',
                'body' => 'Proposta de organizar mutirões fixos no primeiro sábado de cada mês, com apoio da associação de moradores.',
                'type' => TopicType::Proposta,
            ],
            [
                'category' => 'desenvolvimento-social',
                'title' => 'Grupo de apoio a catadores locais',
                'body' => 'Estamos formando um grupo para articular doações de materiais recicláveis e capacitação.',
                'type' => TopicType::Discussao,
            ],
            [
                'category' => 'desenvolvimento-social',
                'title' => 'Oficina de reutilização para jovens',
                'body' => 'Ideia de oficinas mensais transformando descartes em objetos úteis, com foco em jovens da periferia.',
                'type' => TopicType::Sugestao,
            ],
        ];

        $createdTopics = [];

        foreach ($topics as $topicData) {
            $category = $categories[$topicData['category']];

            $createdTopics[] = Topic::create([
                'user_id' => $admin->id,
                'category_id' => $category->id,
                'title' => $topicData['title'],
                'body' => $topicData['body'],
                'type' => $topicData['type'],
                'votes_count' => 0,
            ]);
        }

        Post::create([
            'topic_id' => $createdTopics[0]->id,
            'user_id' => $admin->id,
            'body' => 'Registrei no app da prefeitura na semana passada. Protocolo #2026-0812.',
            'parent_id' => null,
        ]);

        Post::create([
            'topic_id' => $createdTopics[0]->id,
            'user_id' => $admin->id,
            'body' => 'Também vi moradores separando o lixo manualmente enquanto aguardamos a coleta.',
            'parent_id' => null,
        ]);

        $firstReply = Post::create([
            'topic_id' => $createdTopics[3]->id,
            'user_id' => $admin->id,
            'body' => 'Apoio a proposta. Posso ajudar com contato na associação de moradores.',
            'parent_id' => null,
        ]);

        Post::create([
            'topic_id' => $createdTopics[3]->id,
            'user_id' => $admin->id,
            'body' => 'Ótimo! Vamos marcar uma reunião presencial na próxima semana.',
            'parent_id' => $firstReply->id,
        ]);

        Post::create([
            'topic_id' => $createdTopics[8]->id,
            'user_id' => $admin->id,
            'body' => 'Tenho contato com uma cooperativa que pode orientar sobre logística de coleta.',
            'parent_id' => null,
        ]);
    }
}
