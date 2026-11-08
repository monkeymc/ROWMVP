# MVP Atlas · Ragnarok the New World

**Live site:** https://munzhkin.github.io/ROWMVP/

Made by Guild Parazuuuu.

## Run offline

Extract the archive and open index.html in a modern browser. No installation or internet connection is required.

The world atlas opens first. Hover or focus a boss portrait on an island to enlarge it and show its name. Click or tap the portrait to go directly to its guide. Select the island label to browse the region. Select a boss in the index to open its combat guide. Use the search box, level filter, and element filter to narrow the list. Zoom with + and −, drag the enlarged map to pan, and use the center control to fit the archipelago.

The atlas uses Three.js and WebGL to render custom island meshes. If WebGL is unavailable, a Canvas 2D renderer draws the same geometry and keeps the island controls active. The eight island regions are atlas groupings by level.

Each boss guide includes its race, size, element matchups, and scored cards for ten equipment slots. Use the left and right arrow keys to browse slots and Escape to return. Direct links such as index.html#boss=80014 open a boss guide.

Scores follow the supplied dataset. A slot holds two cards and the same card can be used twice, so the Advantage SUM counts each slot's top card twice (armor-element cards once, since a second copy adds nothing, plus the best non-element armor card). It is split into Attack (damage dealt, plus the attack-element bonus) and Defensive (damage taken, including armor-element and neutral-rule cards); the two parts add up to the total shown under the bars. The displayed range follows the lowest and highest eligible card rolls.

English text was adapted from the supplied Taiwan dataset. Regional in-game spellings may differ. Boss and element images and card artwork are embedded in data.js for offline use. Card artwork is matched to its original item icon from roworlddb.com/media/images/item/.

Game data and images belong to their respective owners. Source: https://roworlddb.com/

## Apocalypse island (S1 · 2026/10/3 – 2027/1/1)

A detached ninth island, Apocalypse, sits in the open space to the right of the map title, with no sea route to the other islands. Its five season bosses come from the in-game "แดนสุสานคำสาปมรณะ" season screen; order follows the season path (Amon Ra → Pharaoh → Bloody Knight → Dark Lord → Anubis); names and portraits are in apocalypse.js and assets/apocalypse/. Amon Ra, Pharaoh, Bloody Knight and Dark Lord reuse the element, race, size and card data of the same MVPs on the other islands. Anubis (Undead, Demi-Human, Large) has no matching MVP, so its cards were scored with the same rules as the dataset: Demi-Human, Large and general effects from Pharaoh and Undead-element effects from Dark Lord (Pharaoh − Baphomet + Dark Lord). The same method reproduces all 24 checkable boss combinations in the original data exactly. apocalypse.js applies it when the page loads. Its level is not known.

## Apocalypse island (S2 · 冰封海淵 Frozen Abyss)

A second detached island, Apocalypse S2, sits beside the S1 island. It is a deep-sea island with kraken tentacles, a shipwreck, coral, kelp and glowing anemones. When there is not enough room next to the map title, both islands' portraits shrink to fit, down to 70%. Its five bosses and their order come from the Taiwan-server season data on roworlddb.com (dungeon "calamity", season 2): Stormy Knight → Crystal Queen → Ancient Sea God → Kraken → Garm. All are level 100. S2 has not started on the Thai server, so there are no Thai names or dates yet. Portraits are cropped from the roworlddb season art.

Stormy Knight (冰暴騎士), Kraken (魔鬼大烏賊) and Garm (卡崙) are the same monsters as the MVPs of those names and reuse their data. Ancient Sea God (遠古海神) is Water, Fish, Large, the same as Kraken, so it reuses Kraken's card data. Crystal Queen (幻晶女王) is Water, Demon, Large, which no MVP has, so its cards are derived as Dracula − Atroce + Garm. Owl Baron − Phreeoni + Garm gives the same cards. The English names Crystal Queen and Ancient Sea God are translations of the Taiwan names.
