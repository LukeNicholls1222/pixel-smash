# PIXEL SMASH

ブラウザで動くスマブラ風の2D対戦。依存ライブラリなし、`index.html` を開けば動く。

## キャラの画像について

3体の怪物は [OpenDuelyst](https://github.com/open-duelyst/duelyst)（Counterplay Games）のユニット画像で、
**CC0 1.0（パブリックドメイン）** で公開されているものを使っている。詳細は `assets/duelyst/LICENSE.txt`。

| 表示名 | 元のユニット |
|---|---|
| カオスナイト | boss_chaosknight |
| モルテンゴーレム | neutral_moltengolem |
| フェンリル | f6_fenrirwerewolf |

キャラを増やすときは、同じリポジトリの `app/resources/units/` から `.png` と `.plist` を取り、
`assets/duelyst/atlas.js` にコマ割りを足して、`js/chars.js` に `art` を書く。
コマの足元と縮尺は、待機1コマ目の不透明ピクセルから起動時に自動で測る。

- 1P: A/D 移動、W 上、S 下、SPACE ジャンプ、J 攻撃、I スマッシュ、K 必殺、L シールド
- 2P: ←→ 移動、↑↓、Enter ジャンプ、`,` 攻撃、M スマッシュ、`.` 必殺、`/` シールド
- ゲームパッド対応（1台目が1P、2台目が2P）。右スティックでスマッシュ。2Pは CPU にもできる
- 方向 + 攻撃 = 強攻撃、スマッシュボタン + 方向 = スマッシュ（方向をはじいて攻撃でも出る）、上 + 必殺 = 復帰技
- 崖の縁につかまれる。上かジャンプで上がる、攻撃で攻撃しながら上がる、下で離す
- 試合中 H で操作表
- F2 で当たり判定の表示

キャラの数値は `js/chars.js`、ステージの形は `js/const.js`。
コンソールで `__dbg.step(60)` とすると60フレーム進む（動作確認用）。
