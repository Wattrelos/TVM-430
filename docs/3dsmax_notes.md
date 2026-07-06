# Notas de Exportação (3DS Max) e Integração de Texturas no Trainz

Este documento serve como referência para os procedimentos e boas práticas ao exportar malhas (`.im` / `.kin`) do 3DS Max e configurar a substituição dinâmica de texturas no Trainz.

---

## 1. Funcionamento do `SetFXTextureReplacement` em Objetos Animados

* **Compatibilidade:** A função `SetFXTextureReplacement` **funciona perfeitamente em objetos animados** (que utilizam arquivos `.kin`). A animação de ossos (bones) ou vértices não impede nem anula a substituição de textura em tempo de execução.
* **Escopo:** O efeito de substituição de textura deve ser definido no container da mesh correspondente dentro da `mesh-table` no `config.txt`.

---

## 2. Resolução de Caminhos de Texturas no `config.txt`

Ao trabalhar com meshes organizadas em subpastas (como `pointer_speedo/`):

1. **Sem Prefixo de Pasta:** Na configuração de efeitos de substituição de textura (`texture-replacement`), a tag `texture` deve conter **apenas o nome da textura original** (com a extensão `.texture`), **sem** o caminho relativo da pasta.
   * **Incorreto:** `texture "pointer_speedo\red_pointer_bar-red_pointer_bar.texture"`
   * **Correto:** `texture "red_pointer_bar-red_pointer_bar.texture"`

2. **Como o Trainz funciona internamente:** O Trainz associa as texturas referenciadas no arquivo `.im` de forma local à pasta onde a mesh está inserida. Portanto, adicionar o prefixo do diretório na tag `texture` causará falha na busca e a substituição não funcionará.

---

## 3. Cuidados no 3DS Max e Mapeamento de Materiais

* **Textura Alvo Correta:** Certifique-se de aplicar o material correto sobre os objetos/ossos móveis no 3DS Max.
  * No caso do ponteiro de velocidade (`speedometer.im`), o material móvel deve usar a textura específica do ponteiro (`red_pointer_bar-red_pointer_bar.texture`), enquanto a textura da escala de fundo (`speedometer.texture` / `Speedometer.texture`) pertence apenas à base fixa (`speedo_base.im`).
  * Tentar aplicar a substituição de textura no script usando o nome da textura errada (que não está mapeada na mesh correspondente no 3DS Max) fará com que o efeito não tenha ação visual.
* **Nomes dos Arquivos de Textura:** Evite usar caminhos muito complexos ou nomes redundantes na compilação do material no 3DS Max para evitar que o arquivo `.im` final fique com referências difíceis de rastrear.
