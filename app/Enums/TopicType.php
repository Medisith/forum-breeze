<?php

namespace App\Enums;

enum TopicType: string
{
    case Discussao = 'discussao';
    case Sugestao = 'sugestao';
    case Proposta = 'proposta';
    case Material = 'material';
}
