# Coloque aqui o modelo exportado do Teachable Machine

Esta pasta precisa conter **três arquivos**, exatamente com estes nomes:

```
public/model/
├── model.json
├── metadata.json
└── weights.bin
```

## Como obter

1. Abra <https://teachablemachine.withgoogle.com> → **Get Started** → **Image Project** → **Standard image model**.
2. Crie as classes com **estes nomes** (o app já os reconhece):
   `Reciclável`, `Orgânico`, `Rejeito`, `Nada`.
3. Grave as amostras pela webcam (mín. ~80 imagens por classe, variando ângulo,
   distância, fundo e iluminação).
4. **Train Model** → **Export Model** → aba **TensorFlow.js** → **Download my model**.
5. Descompacte o `.zip` e mova os três arquivos para dentro desta pasta.

> Se vocês usarem outros nomes de classe, acrescente o apelido em `ALIASES`
> dentro de `src/config.ts`. Rótulo não reconhecido é tratado como neutro e
> nunca dispara ação.

Os três arquivos somam poucos MB e **devem** ser versionados no Git — o
enunciado exige o modelo no repositório.
