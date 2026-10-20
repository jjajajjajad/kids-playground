/* 자동 생성 — tools/build.js. 아이 놀이터 오프라인 실행용 */
const VERSION = "a8d56a36";
// 저장소는 하나로 고정 — 새 버전은 지난번 목록과 지문을 비교해 바뀐/새 파일만 받고, 빠진 파일은 지움
const CACHE = "kp-app";
const MANIFEST = "__kp_manifest__"; // 지난번에 받은 파일 목록과 지문 (저장소 안에 보관)
const VOICE_CACHE = "kp-voice-1";
// 꼭 필요한 파일(화면·코드·스타일) — 하나라도 못 받으면 설치 실패(옛 버전 그대로 유지)
const CORE = {"manifest.webmanifest":"5a8c865d","css/app.css?v=b8cef7de":"b8cef7de","css/fonts.css?v=bc0eca35":"bc0eca35","js/core/kp.js?v=3ecee5b7":"3ecee5b7","js/gen/emoji-map.js?v=007540d7":"007540d7","js/gen/version.js?v=3982609b":"3982609b","js/core/art.js?v=453536c5":"453536c5","js/core/store.js?v=a54491e2":"a54491e2","js/core/settings.js?v=b3534ade":"b3534ade","js/core/audio.js?v=3e6d0cf1":"3e6d0cf1","js/core/voice.js?v=03363d7e":"03363d7e","js/gen/clips.js?v=5be6ad88":"5be6ad88","js/core/ui.js?v=8cd67402":"8cd67402","js/core/drag.js?v=680b350e":"680b350e","js/core/paint.js?v=51ba10b6":"51ba10b6","js/core/notebook.js?v=0c34f4d4":"0c34f4d4","js/core/celebrate.js?v=a3095869":"a3095869","js/core/home.js?v=d5ff674e":"d5ff674e","js/core/earn.js?v=766ce294":"766ce294","js/core/pages.js?v=1e954bd5":"1e954bd5","js/core/catalog.js?v=06a78f14":"06a78f14","js/games/bigkid/colororder.js?v=5565abae":"5565abae","js/games/bigkid/connect.js?v=4fa3f4b1":"4fa3f4b1","js/games/bigkid/dotdot.js?v=fe3e21ff":"fe3e21ff","js/games/bigkid/dress.js?v=ffc51267":"ffc51267","js/games/bigkid/emotion.js?v=ac11020e":"ac11020e","js/games/bigkid/jigsaw.js?v=5629f114":"5629f114","js/games/bigkid/maze.js?v=08324a82":"08324a82","js/games/bigkid/missing.js?v=9feac608":"9feac608","js/games/bigkid/pattern.js?v=e1f0f428":"e1f0f428","js/games/bigkid/sequence.js?v=678728f3":"678728f3","js/games/bigkid/sort.js?v=7598df12":"7598df12","js/games/bigkid/sorter.js?v=8aeb3603":"8aeb3603","js/games/bigkid/spatial.js?v=2924dc73":"2924dc73","js/games/bigkid/trace.js?v=72d7b8e5":"72d7b8e5","js/games/bigkid/train.js?v=2e1770f1":"2e1770f1","js/games/make/decal.js?v=837154c3":"837154c3","js/games/make/draw.js?v=c1dbde11":"c1dbde11","js/games/make/face.js?v=eb7c68df":"eb7c68df","js/games/make/grow.js?v=f60531be":"f60531be","js/games/make/icecream.js?v=b0b73c5a":"b0b73c5a","js/games/make/paintbook.js?v=5bd36b31":"5bd36b31","js/games/make/paintlab.js?v=d682b967":"d682b967","js/games/make/wipe.js?v=331f626b":"331f626b","js/games/make/zoo.js?v=ace366e6":"ace366e6","js/games/make/zoo3d.js?v=c711ec00":"c711ec00","js/games/music/drum.js?v=2ac6b5e6":"2ac6b5e6","js/games/music/inst.js?v=c70d1c4a":"c70d1c4a","js/games/music/musicbox.js?v=34c6c7b8":"34c6c7b8","js/games/music/piano.js?v=bd0f7cf5":"bd0f7cf5","js/games/music/realpiano.js?v=a0075cc4":"a0075cc4","js/games/music/simon.js?v=4747cee0":"4747cee0","js/games/music/xylo.js?v=52474aa2":"52474aa2","js/games/play/balloon.js?v=4c710a0b":"4c710a0b","js/games/play/bubble.js?v=68593fb1":"68593fb1","js/games/play/candle.js?v=3b54aa02":"3b54aa02","js/games/play/colorpop.js?v=5702d689":"5702d689","js/games/play/croc.js?v=932c96ce":"932c96ce","js/games/play/egg.js?v=c769fe2f":"c769fe2f","js/games/play/firework.js?v=49d8975d":"49d8975d","js/games/play/fish.js?v=d0278999":"d0278999","js/games/play/fruit.js?v=a658744a":"a658744a","js/games/play/light.js?v=917b5c19":"917b5c19","js/games/play/mole.js?v=d735ed6b":"d735ed6b","js/games/play/peekaboo.js?v=2b21e97c":"2b21e97c","js/games/play/race.js?v=d549a489":"d549a489","js/games/play/rocket.js?v=c8363943":"c8363943","js/games/play/rps.js?v=3d3b7bf2":"3d3b7bf2","js/games/smart/abc.js?v=9665aad3":"9665aad3","js/games/smart/animals.js?v=63e93e73":"63e93e73","js/games/smart/awrite.js?v=408e13a8":"408e13a8","js/games/smart/candy.js?v=104b7f41":"104b7f41","js/games/smart/color.js?v=2525c81f":"2525c81f","js/games/smart/count.js?v=eccbf36e":"eccbf36e","js/games/smart/dots.js?v=45674f85":"45674f85","js/games/smart/feed.js?v=d73ab1c4":"d73ab1c4","js/games/smart/hangul.js?v=d989bd9e":"d989bd9e","js/games/smart/hwrite.js?v=ca2b5cac":"ca2b5cac","js/games/smart/listen.js?v=70c96d66":"70c96d66","js/games/smart/memory.js?v=6fef3e8b":"6fef3e8b","js/games/smart/mix.js?v=c466bfff":"c466bfff","js/games/smart/more.js?v=62792d1e":"62792d1e","js/games/smart/n100.js?v=4f03f235":"4f03f235","js/games/smart/numbers.js?v=37c550cf":"37c550cf","js/games/smart/nwrite.js?v=88ad450b":"88ad450b","js/games/smart/odd.js?v=1bce3f69":"1bce3f69","js/games/smart/shadow.js?v=fb114dad":"fb114dad","js/games/smart/shape.js?v=df05c0d8":"df05c0d8","js/games/smart/size.js?v=eb28437d":"eb28437d","js/core/app.js?v=402eb1c4":"402eb1c4","vendor/three.module.min.js":"512c8b83"};
// 그림·폰트 — 몇 개 못 받아도(404·429) 설치는 진행, 빠진 건 쓸 때 받음
const EXTRA = {"fonts/jua-10-400-normal.woff2":"d39a74df","fonts/jua-100-400-normal.woff2":"2a8800ce","fonts/jua-101-400-normal.woff2":"3660636c","fonts/jua-102-400-normal.woff2":"0a74009c","fonts/jua-103-400-normal.woff2":"4120bcc5","fonts/jua-104-400-normal.woff2":"fe9fbc27","fonts/jua-105-400-normal.woff2":"e38419c6","fonts/jua-106-400-normal.woff2":"8910eada","fonts/jua-107-400-normal.woff2":"b877114d","fonts/jua-108-400-normal.woff2":"e7b7ce84","fonts/jua-109-400-normal.woff2":"fc865078","fonts/jua-11-400-normal.woff2":"b26e2cb8","fonts/jua-110-400-normal.woff2":"6c01089f","fonts/jua-111-400-normal.woff2":"cea10e51","fonts/jua-112-400-normal.woff2":"55b315f6","fonts/jua-113-400-normal.woff2":"b85f7818","fonts/jua-114-400-normal.woff2":"65306611","fonts/jua-115-400-normal.woff2":"42f2d2be","fonts/jua-116-400-normal.woff2":"2bc3c493","fonts/jua-117-400-normal.woff2":"606baf01","fonts/jua-118-400-normal.woff2":"cb8d2327","fonts/jua-119-400-normal.woff2":"bf365fe4","fonts/jua-12-400-normal.woff2":"2d551bb0","fonts/jua-13-400-normal.woff2":"c97dc69d","fonts/jua-14-400-normal.woff2":"43cab423","fonts/jua-15-400-normal.woff2":"bd7bf4b9","fonts/jua-16-400-normal.woff2":"3bb9b09d","fonts/jua-17-400-normal.woff2":"18c2b1e5","fonts/jua-18-400-normal.woff2":"550d8148","fonts/jua-19-400-normal.woff2":"7455f19c","fonts/jua-2-400-normal.woff2":"5469b357","fonts/jua-20-400-normal.woff2":"db088b82","fonts/jua-21-400-normal.woff2":"4375a9c8","fonts/jua-22-400-normal.woff2":"7f1e563c","fonts/jua-23-400-normal.woff2":"37b699a4","fonts/jua-24-400-normal.woff2":"631fee8b","fonts/jua-25-400-normal.woff2":"9d24bc15","fonts/jua-26-400-normal.woff2":"d14cca2a","fonts/jua-27-400-normal.woff2":"03e9c388","fonts/jua-28-400-normal.woff2":"6d16d793","fonts/jua-29-400-normal.woff2":"5e6576d3","fonts/jua-3-400-normal.woff2":"8265977f","fonts/jua-30-400-normal.woff2":"d3f9c400","fonts/jua-31-400-normal.woff2":"9951061f","fonts/jua-32-400-normal.woff2":"64e9519d","fonts/jua-33-400-normal.woff2":"fd8a711c","fonts/jua-34-400-normal.woff2":"181982f6","fonts/jua-35-400-normal.woff2":"6f7112aa","fonts/jua-36-400-normal.woff2":"2bd454e9","fonts/jua-37-400-normal.woff2":"90f7388b","fonts/jua-38-400-normal.woff2":"335a1f2a","fonts/jua-39-400-normal.woff2":"d385ecc8","fonts/jua-4-400-normal.woff2":"19887088","fonts/jua-40-400-normal.woff2":"921f7035","fonts/jua-41-400-normal.woff2":"6d07e150","fonts/jua-42-400-normal.woff2":"21ba8a29","fonts/jua-43-400-normal.woff2":"e4bd1c97","fonts/jua-44-400-normal.woff2":"c7084e5c","fonts/jua-45-400-normal.woff2":"2dac4108","fonts/jua-46-400-normal.woff2":"fb92bdc4","fonts/jua-47-400-normal.woff2":"ac98e0b4","fonts/jua-48-400-normal.woff2":"1180a2ec","fonts/jua-49-400-normal.woff2":"fcdbe974","fonts/jua-5-400-normal.woff2":"9f164321","fonts/jua-50-400-normal.woff2":"e099d343","fonts/jua-51-400-normal.woff2":"67e12ebb","fonts/jua-52-400-normal.woff2":"be4b961a","fonts/jua-53-400-normal.woff2":"f4a7f448","fonts/jua-54-400-normal.woff2":"95ef7c56","fonts/jua-55-400-normal.woff2":"450f7df7","fonts/jua-56-400-normal.woff2":"02239853","fonts/jua-57-400-normal.woff2":"c95c66b7","fonts/jua-58-400-normal.woff2":"80567caf","fonts/jua-59-400-normal.woff2":"adcb1637","fonts/jua-6-400-normal.woff2":"f51b3afd","fonts/jua-60-400-normal.woff2":"9a020465","fonts/jua-61-400-normal.woff2":"353cc20f","fonts/jua-62-400-normal.woff2":"52c3edbf","fonts/jua-63-400-normal.woff2":"568a6e40","fonts/jua-64-400-normal.woff2":"1294ed26","fonts/jua-65-400-normal.woff2":"33624917","fonts/jua-7-400-normal.woff2":"c3c4617c","fonts/jua-8-400-normal.woff2":"f55e9ce9","fonts/jua-9-400-normal.woff2":"494ff7eb","fonts/jua-94-400-normal.woff2":"1cc43480","fonts/jua-95-400-normal.woff2":"e9d65812","fonts/jua-latin-400-normal.woff2":"7f9f8824","assets/e/abacus.svg":"1dc5edea","assets/e/airplane.svg":"12315447","assets/e/alarm-clock.svg":"e66dbad7","assets/e/ambulance.svg":"1257119c","assets/e/anger-symbol.svg":"f849e627","assets/e/angry-face.svg":"73f0b618","assets/e/ant.svg":"c306ebab","assets/e/articulated-lorry.svg":"7ce8bd54","assets/e/artist-palette.svg":"ba122dac","assets/e/astonished-face.svg":"08f8afc2","assets/e/automobile.svg":"6251f935","assets/e/baby-chick.svg":"77ded7cb","assets/e/baby.svg":"842e6835","assets/e/backhand-index-pointing-left.svg":"1162d267","assets/e/backhand-index-pointing-up.svg":"496ab2b1","assets/e/backpack.svg":"022d56bc","assets/e/balance-scale.svg":"d5a64074","assets/e/balloon.svg":"7e61c6cb","assets/e/banana.svg":"4c21d196","assets/e/baseball.svg":"01b3628e","assets/e/basket.svg":"3dbdf2e6","assets/e/basketball.svg":"707cc2ad","assets/e/bat.svg":"a54ef98a","assets/e/beach-with-umbrella.svg":"0164a51a","assets/e/beans.svg":"c5d23201","assets/e/bear.svg":"6d50b32b","assets/e/beating-heart.svg":"be0ab3c2","assets/e/bed.svg":"ef361dd5","assets/e/bell.svg":"caccdc8d","assets/e/beverage-box.svg":"86fa5abc","assets/e/bicycle.svg":"818f4926","assets/e/billed-cap.svg":"a12de68c","assets/e/bird.svg":"3dc54300","assets/e/birthday-cake.svg":"4df34edd","assets/e/black-heart.svg":"0397b3a7","assets/e/black-large-square.svg":"c7103869","assets/e/blossom.svg":"0fa0c676","assets/e/blowfish.svg":"d32e7b53","assets/e/blue-book.svg":"0d6f4cf9","assets/e/blue-circle.svg":"99fb849f","assets/e/blue-heart.svg":"35b8afa7","assets/e/blue-square.svg":"3d70d66c","assets/e/blueberries.svg":"84282e0c","assets/e/bone.svg":"2e6fddd6","assets/e/books.svg":"e614ddc2","assets/e/bowl-with-spoon.svg":"102dd86c","assets/e/boy.svg":"a0dfb1c7","assets/e/brain.svg":"ec1b37a9","assets/e/bread.svg":"3a6781a9","assets/e/brick.svg":"6d836499","assets/e/broccoli.svg":"f3e171f8","assets/e/brown-heart.svg":"f922bc0d","assets/e/bubbles.svg":"48246f76","assets/e/bucket.svg":"fe0cc2a7","assets/e/bug.svg":"6936283a","assets/e/bullseye.svg":"7ed0bfdc","assets/e/bus.svg":"9cdc66dc","assets/e/butterfly.svg":"56c789e3","assets/e/camera-with-flash.svg":"15f32bb2","assets/e/camera.svg":"e710bff3","assets/e/candle.svg":"67efba1b","assets/e/candy.svg":"3606d3c5","assets/e/card-index-dividers.svg":"df175034","assets/e/carrot.svg":"be78bdcf","assets/e/castle.svg":"244b0c53","assets/e/cat-face.svg":"2eea7b2b","assets/e/check-mark-button.svg":"13a80e9b","assets/e/check-mark.svg":"3ae507c6","assets/e/cheese-wedge.svg":"3d4873b3","assets/e/chequered-flag.svg":"b362fbd5","assets/e/cherries.svg":"04ff23cc","assets/e/cherry-blossom.svg":"cf78e917","assets/e/chestnut.svg":"45482bf8","assets/e/chicken.svg":"7c649b1a","assets/e/child.svg":"db4821df","assets/e/chipmunk.svg":"dd65d973","assets/e/chocolate-bar.svg":"8ca109a6","assets/e/circus-tent.svg":"eb0dbfc6","assets/e/clapping-hands.svg":"06549eda","assets/e/clipboard.svg":"bc491b53","assets/e/closed-book.svg":"ce98e3c7","assets/e/cloud-with-lightning-and-rain.svg":"c5c64ce1","assets/e/cloud-with-rain.svg":"9a416d6a","assets/e/cloud.svg":"8a6b444b","assets/e/clown-face.svg":"317b4873","assets/e/coat.svg":"76a5e989","assets/e/collision.svg":"c3baafe5","assets/e/construction.svg":"3039aaea","assets/e/cookie.svg":"ba1c7e17","assets/e/cooking.svg":"5ebeecc4","assets/e/coral.svg":"9691363e","assets/e/counterclockwise-arrows-button.svg":"b2f9e940","assets/e/cow-face.svg":"dd69e56a","assets/e/cow.svg":"7da37b26","assets/e/crab.svg":"b1027699","assets/e/crayon.svg":"54df73f2","assets/e/crescent-moon.svg":"34ebd938","assets/e/crocodile.svg":"1554a068","assets/e/crown.svg":"c62f977a","assets/e/crying-face.svg":"c5f83a42","assets/e/cucumber.svg":"c965eb2d","assets/e/cupcake.svg":"c540fd6f","assets/e/curry-rice.svg":"5baa595b","assets/e/cyclone.svg":"71f11a01","assets/e/dashing-away.svg":"383e2915","assets/e/deciduous-tree.svg":"bb4ffc4e","assets/e/deer.svg":"7199b040","assets/e/desert-island.svg":"bd15f843","assets/e/desert.svg":"fd8fac5a","assets/e/dizzy.svg":"2f9b755a","assets/e/dog-face.svg":"75113ddb","assets/e/dog.svg":"f316b4e8","assets/e/dolphin.svg":"36ca0926","assets/e/door.svg":"560accd5","assets/e/doughnut.svg":"020a060f","assets/e/dove.svg":"b6a1eb00","assets/e/down-arrow.svg":"564b82ba","assets/e/dragon.svg":"c76b0cc6","assets/e/dress.svg":"48cde48c","assets/e/droplet.svg":"fd125602","assets/e/drum.svg":"5427c3c1","assets/e/duck.svg":"cb59a8b6","assets/e/eagle.svg":"1295df63","assets/e/ear-of-corn.svg":"408213ad","assets/e/ear.svg":"ad5b56c8","assets/e/egg.svg":"9ae5e76e","assets/e/eggplant.svg":"c8879b87","assets/e/elephant.svg":"758d0de0","assets/e/evergreen-tree.svg":"5f8defff","assets/e/ewe.svg":"539c2afc","assets/e/eyes.svg":"6b731e41","assets/e/face-savoring-food.svg":"e7c0811b","assets/e/face-with-medical-mask.svg":"510e8a3c","assets/e/face-with-raised-eyebrow.svg":"a7dd6f3c","assets/e/fallen-leaf.svg":"82916559","assets/e/fearful-face.svg":"b416570c","assets/e/film-frames.svg":"cdbe3a08","assets/e/fire-engine.svg":"40967479","assets/e/fire.svg":"143598a3","assets/e/fireworks.svg":"b73ff454","assets/e/first-quarter-moon.svg":"35894094","assets/e/fish.svg":"78c768b7","assets/e/flamingo.svg":"f3699fc2","assets/e/flashlight.svg":"13e68162","assets/e/flexed-biceps.svg":"a0200e43","assets/e/floppy-disk.svg":"0a0b86bf","assets/e/flushed-face.svg":"4cd3c4da","assets/e/flute.svg":"d2127ae1","assets/e/flying-saucer.svg":"a560a148","assets/e/fork-and-knife-with-plate.svg":"35321dbc","assets/e/fork-and-knife.svg":"63c02fe9","assets/e/fox.svg":"2d678ad2","assets/e/framed-picture.svg":"063989ab","assets/e/frog.svg":"9c3de8ed","assets/e/front-facing-baby-chick.svg":"12f17fda","assets/e/fuel-pump.svg":"25d87f32","assets/e/game-die.svg":"117c5076","assets/e/gear.svg":"24c82b4d","assets/e/gem-stone.svg":"1436dd43","assets/e/ghost.svg":"0689d704","assets/e/giraffe.svg":"0e46bc44","assets/e/girl.svg":"19ca6055","assets/e/glass-of-milk.svg":"c6647ae1","assets/e/glasses.svg":"fa478cdc","assets/e/globe-showing-europe-africa.svg":"7dabc2a1","assets/e/globe-with-meridians.svg":"1832f472","assets/e/gloves.svg":"5844a685","assets/e/glowing-star.svg":"fe7857db","assets/e/goal-net.svg":"26fe0c84","assets/e/grapes.svg":"48d68a8a","assets/e/green-apple.svg":"4f900e50","assets/e/green-book.svg":"8f39b2ac","assets/e/green-circle.svg":"55d9e8c4","assets/e/green-heart.svg":"7069ec0a","assets/e/green-square.svg":"e8c7ae8d","assets/e/grinning-face.svg":"1dc384ba","assets/e/guitar.svg":"7da01d9c","assets/e/hamburger.svg":"52260062","assets/e/hammer.svg":"8fd553fe","assets/e/hamster.svg":"ad2df7f6","assets/e/handbag.svg":"0d316e55","assets/e/handshake.svg":"2d348eda","assets/e/hatching-chick.svg":"64eacd23","assets/e/headphone.svg":"3a125bbd","assets/e/heart-suit.svg":"70dc1679","assets/e/heavy-equals-sign.svg":"7c7f2eef","assets/e/helicopter.svg":"0d2b562c","assets/e/herb.svg":"c7511990","assets/e/hibiscus.svg":"7021d81d","assets/e/high-voltage.svg":"901af27c","assets/e/hiking-boot.svg":"6adee979","assets/e/hippopotamus.svg":"74cf1e95","assets/e/honey-pot.svg":"c5a65c10","assets/e/honeybee.svg":"d245be1b","assets/e/horse-face.svg":"e01552d9","assets/e/hourglass-not-done.svg":"40c38855","assets/e/house.svg":"9cd42a8f","assets/e/hundred-points.svg":"29e579df","assets/e/hyacinth.svg":"322e64d7","assets/e/ice.svg":"583bf6a7","assets/e/index-pointing-up.svg":"f0be46b6","assets/e/input-latin-letters.svg":"da71fcc9","assets/e/input-numbers.svg":"1b872134","assets/e/jack-o-lantern.svg":"33b54a17","assets/e/jar.svg":"e4343a8c","assets/e/jeans.svg":"2d282fe4","assets/e/jellyfish.svg":"09b2c55b","assets/e/joker.svg":"5bfbcac3","assets/e/key.svg":"6611a81f","assets/e/keycap-1.svg":"722d161e","assets/e/keycap-10.svg":"a421b509","assets/e/keycap-2.svg":"f2bdb7ef","assets/e/keycap-3.svg":"ff02e2e3","assets/e/keycap-4.svg":"cd3e852d","assets/e/keycap-5.svg":"6ffaf7bc","assets/e/kite.svg":"bdb7ee29","assets/e/kiwi-fruit.svg":"ec18e545","assets/e/koala.svg":"ac8634bd","assets/e/ladder.svg":"f4f05a95","assets/e/lady-beetle.svg":"c99886d9","assets/e/large-blue-diamond.svg":"d73fa6de","assets/e/large-orange-diamond.svg":"cdcfd5b4","assets/e/leaf-fluttering-in-wind.svg":"16a940cb","assets/e/leafy-green.svg":"4349177a","assets/e/ledger.svg":"cab6260c","assets/e/left-right-arrow.svg":"de1ad63c","assets/e/leg.svg":"6dbc18ed","assets/e/lemon.svg":"ea58a981","assets/e/light-bulb.svg":"31c53210","assets/e/link.svg":"854c32b1","assets/e/lion.svg":"c749e2a8","assets/e/llama.svg":"276921e6","assets/e/locked-with-key.svg":"498e010b","assets/e/locked.svg":"612b30d4","assets/e/locomotive.svg":"6fdfb0c4","assets/e/lollipop.svg":"0c227f6c","assets/e/magic-wand.svg":"d89bf652","assets/e/magnifying-glass-tilted-left.svg":"745ddcba","assets/e/maple-leaf.svg":"ea7162aa","assets/e/maracas.svg":"af754cf8","assets/e/meat-on-bone.svg":"f0ef92d9","assets/e/megaphone.svg":"732298ef","assets/e/memo.svg":"83d05def","assets/e/microphone.svg":"978d9e84","assets/e/mobile-phone-off.svg":"59cddde2","assets/e/monkey-face.svg":"8340cf81","assets/e/monkey.svg":"afffdbb6","assets/e/mosquito.svg":"1bd6cf06","assets/e/motorway.svg":"a562de78","assets/e/mouse-face.svg":"eeb445dd","assets/e/mouth.svg":"f2fe8b04","assets/e/movie-camera.svg":"17b02ec9","assets/e/multiply.svg":"6e4ae5c7","assets/e/mushroom.svg":"f67d0769","assets/e/musical-keyboard.svg":"00d7abbe","assets/e/musical-note.svg":"f737b078","assets/e/musical-notes.svg":"a12d62a3","assets/e/musical-score.svg":"1075811c","assets/e/nest-with-eggs.svg":"3de031f0","assets/e/night-with-stars.svg":"bf3aa484","assets/e/nose.svg":"99a7ae86","assets/e/notebook.svg":"8473493d","assets/e/octopus.svg":"f2abdbc9","assets/e/oden.svg":"be0efb07","assets/e/open-book.svg":"aa2cc8ab","assets/e/open-file-folder.svg":"ab914a7c","assets/e/open-hands.svg":"51d73c21","assets/e/orange-book.svg":"c72d3ff3","assets/e/orange-heart.svg":"85745f7c","assets/e/orange-square.svg":"ff1effda","assets/e/owl.svg":"67c3dd2f","assets/e/package.svg":"80ce5564","assets/e/page-facing-up.svg":"67899977","assets/e/paintbrush.svg":"95366c2f","assets/e/palm-tree.svg":"ec0589a6","assets/e/palms-up-together.svg":"76811a55","assets/e/panda.svg":"89189180","assets/e/parrot.svg":"92cf0387","assets/e/party-popper.svg":"f443901c","assets/e/partying-face.svg":"0e02836a","assets/e/paw-prints.svg":"f62b2f4f","assets/e/peach.svg":"b9f18c54","assets/e/peanuts.svg":"7858b71e","assets/e/pear.svg":"b0f7e59f","assets/e/pen.svg":"26907f69","assets/e/pencil.svg":"af77621b","assets/e/penguin.svg":"5bc18f54","assets/e/people-hugging.svg":"3de61583","assets/e/person-getting-haircut.svg":"5d582eb5","assets/e/person-running.svg":"cfd0db4d","assets/e/person-superhero.svg":"82cfb7d1","assets/e/person-walking.svg":"8f9a4675","assets/e/pig-face.svg":"f02c3d3f","assets/e/pineapple.svg":"8be7ea83","assets/e/pink-heart.svg":"60d3657d","assets/e/pizza.svg":"87b67aa0","assets/e/play-button.svg":"d6074a52","assets/e/playground-slide.svg":"06a00b02","assets/e/police-car.svg":"e7f565dc","assets/e/pouring-liquid.svg":"46b24a89","assets/e/princess.svg":"1d900466","assets/e/printer.svg":"186409b5","assets/e/purple-circle.svg":"c0c03247","assets/e/purple-heart.svg":"222355a0","assets/e/purple-square.svg":"42c1d69e","assets/e/pushpin.svg":"cc1ed984","assets/e/puzzle-piece.svg":"45f2e63e","assets/e/rabbit-face.svg":"aea0b240","assets/e/rabbit.svg":"61f78322","assets/e/raccoon.svg":"b3379cad","assets/e/racing-car.svg":"4ec879c8","assets/e/radio.svg":"77293528","assets/e/railway-track.svg":"47cd2f1a","assets/e/rainbow.svg":"a2ff1d58","assets/e/raised-fist.svg":"ede53c5d","assets/e/raised-hand.svg":"eddcf409","assets/e/raising-hands.svg":"b6216d92","assets/e/record-button.svg":"be66a1dc","assets/e/red-apple.svg":"ed6c2138","assets/e/red-circle.svg":"2f30dd7b","assets/e/red-exclamation-mark.svg":"3eb615c6","assets/e/red-heart.svg":"0e767b3c","assets/e/red-question-mark.svg":"7a6f92a0","assets/e/red-square.svg":"08aafee8","assets/e/red-triangle.svg":"620f3a47","assets/e/repeat-button.svg":"4d1c4248","assets/e/ribbon.svg":"cb97d907","assets/e/rice-ball.svg":"eaa57c87","assets/e/right-arrow-curving-left.svg":"5cb5c8f5","assets/e/right-arrow.svg":"7ae6666b","assets/e/ringed-planet.svg":"5a056f1a","assets/e/roasted-sweet-potato.svg":"10d659de","assets/e/robot.svg":"b9fb0b49","assets/e/rocket.svg":"7e8b4831","assets/e/roll-of-paper.svg":"f51845e2","assets/e/rooster.svg":"dd7d658e","assets/e/rose.svg":"43263e22","assets/e/round-pushpin.svg":"13dbe420","assets/e/running-shoe.svg":"fe5c3e01","assets/e/sailboat.svg":"ff46325b","assets/e/sauropod.svg":"438cf69f","assets/e/scarf.svg":"f691ff72","assets/e/seal.svg":"aa93dd39","assets/e/see-no-evil-monkey.svg":"6d374bc8","assets/e/seedling.svg":"246c0e1c","assets/e/shark.svg":"8bd714c7","assets/e/sheaf-of-rice.svg":"15e69fc7","assets/e/shortcake.svg":"1a9b0aa6","assets/e/shorts.svg":"ee2c2240","assets/e/sleeping-face.svg":"f56581c6","assets/e/slightly-smiling-face.svg":"81045a3f","assets/e/smiling-face-with-smiling-eyes.svg":"c5725f0c","assets/e/smiling-face-with-sunglasses.svg":"b76d996b","assets/e/snail.svg":"0292e029","assets/e/snake.svg":"63070ea4","assets/e/snowflake.svg":"39c80b14","assets/e/snowman-without-snow.svg":"7a0ae019","assets/e/soap.svg":"982cfe82","assets/e/soccer-ball.svg":"62eb3d36","assets/e/socks.svg":"f8b38f3e","assets/e/soft-ice-cream.svg":"67f6b12f","assets/e/sparkles.svg":"782cf2ad","assets/e/sparkling-heart.svg":"17adf317","assets/e/speaker-high-volume.svg":"347e0cbf","assets/e/spider.svg":"49711f2d","assets/e/spiral-shell.svg":"58c67e25","assets/e/sponge.svg":"f1a1d665","assets/e/spoon.svg":"3118527a","assets/e/sport-utility-vehicle.svg":"160a278c","assets/e/sports-medal.svg":"fea08ee1","assets/e/spouting-whale.svg":"3e73f547","assets/e/squid.svg":"91ba1f80","assets/e/star.svg":"32d361bc","assets/e/statue-of-liberty.svg":"03583492","assets/e/steaming-bowl.svg":"38860778","assets/e/stop-button.svg":"f1388097","assets/e/strawberry.svg":"93fcdd8a","assets/e/sun.svg":"04073832","assets/e/sunflower.svg":"a87a552e","assets/e/sunglasses.svg":"0035cbb8","assets/e/sweat-droplets.svg":"2dbfa746","assets/e/t-rex.svg":"39f019f8","assets/e/t-shirt.svg":"f63e9f7c","assets/e/tanabata-tree.svg":"c2187311","assets/e/tangerine.svg":"2b5127b8","assets/e/teddy-bear.svg":"9eeea443","assets/e/television.svg":"2ae1ba17","assets/e/tent.svg":"ccb360cd","assets/e/test-tube.svg":"a36ace9b","assets/e/thong-sandal.svg":"67b24fbe","assets/e/thumbs-up.svg":"24c7a71f","assets/e/tiger-face.svg":"5f2993c9","assets/e/tomato.svg":"f5eae065","assets/e/tooth.svg":"651354f4","assets/e/toothbrush.svg":"d856b426","assets/e/top-hat.svg":"544b8208","assets/e/tractor.svg":"aea71dee","assets/e/triangular-flag.svg":"940265c9","assets/e/trophy.svg":"84fcc601","assets/e/tropical-fish.svg":"8209b885","assets/e/trumpet.svg":"10936731","assets/e/tulip.svg":"bca3cf30","assets/e/turtle.svg":"0cd0d80a","assets/e/two-hearts.svg":"b5f2451a","assets/e/two-hump-camel.svg":"be415c84","assets/e/umbrella-on-ground.svg":"555b89e5","assets/e/umbrella.svg":"8eb34fa0","assets/e/unicorn.svg":"c603dbc9","assets/e/unlocked.svg":"c942e8f1","assets/e/vertical-traffic-light.svg":"c5440f80","assets/e/victory-hand.svg":"6a242e7d","assets/e/video-game.svg":"c9482093","assets/e/violin.svg":"fb9ce604","assets/e/volcano.svg":"77b77c58","assets/e/wastebasket.svg":"7aaec9a4","assets/e/watch.svg":"5b913e68","assets/e/water-wave.svg":"fc354ffa","assets/e/watermelon.svg":"7a3faea0","assets/e/waving-hand.svg":"b3f75c8d","assets/e/wavy-dash.svg":"d93b8273","assets/e/white-circle.svg":"ea01d443","assets/e/white-heart.svg":"c5fdb294","assets/e/wind-chime.svg":"de8b442d","assets/e/wolf.svg":"65e92dd8","assets/e/woman.svg":"b5318dd7","assets/e/wood.svg":"c11ad24d","assets/e/world-map.svg":"7fe7c548","assets/e/wrapped-gift.svg":"ce822524","assets/e/writing-hand.svg":"093c3472","assets/e/x-ray.svg":"1fabc029","assets/e/yellow-circle.svg":"c3f6203d","assets/e/yellow-heart.svg":"4d16a9fb","assets/e/yellow-square.svg":"d5206c35","assets/e/yo-yo.svg":"16436566","assets/e/zebra.svg":"432dab82","assets/e/zzz.svg":"4f04519b","icons/apple-touch-icon.png":"8c1f4898","icons/icon-192.png":"7880ac3a","icons/icon-512.png":"602aca75","icons/icon-maskable-512.png":"9af0f899"};
const ALWAYS = ["./", "index.html"]; // 화면은 늘 새로
const req = (f) => new Request(f, { cache: "reload" });
const abs = (f) => new URL(f, self.registration.scope).href;
const KNOWN = new Set([...ALWAYS, ...Object.keys(CORE), ...Object.keys(EXTRA)].map(abs));
async function getMan(c, key) {
  try {
    const r = await c.match(key);
    return r ? await r.json() : {};
  } catch (e) {
    return {};
  }
}
const PREV = "__kp_manifest_prev__"; // 직전 버전 목록 — 열려 있는 옛 화면이 쓰던 파일을 한 버전 동안 남겨 둠
const jres = (o) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
// 받은 내용의 지문(build.js 와 같은 sha1 앞 8자리)
async function hashOf(r) {
  const d = await crypto.subtle.digest("SHA-1", await r.clone().arrayBuffer());
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 8);
}
// 이미 가진 것이면 null, 아니면 저장할 응답 (아직 저장하지 않음 — 다 받은 뒤 한꺼번에)
async function need(c, old, url, hash, migrate) {
  const hit = await c.match(url);
  if (hit && (url.endsWith("?v=" + hash) || old[url] === hash)) return null; // 주소에 지문이 있거나 지난번 지문과 같음
  if (migrate) {
    // 처음 이 방식으로 바뀔 때: 옛 저장소의 그림·폰트를 내용이 같을 때만 옮겨 씀
    const prev = await caches.match(url);
    if (prev && (await hashOf(prev)) === hash) return prev;
  }
  const r = await fetch(req(url));
  if (!r.ok) throw new Error(url + " " + r.status);
  r.kpNet = (await r.clone().arrayBuffer()).byteLength; // 인터넷에서 받은 크기(바이트) — 알림용
  return r;
}
// 화면에 진행 상황 알리기 (화면 쪽 app.js 가 '받는 중' 알림·'새 버전 준비' 창을 띄움)
async function tell(m) {
  for (const cl of await self.clients.matchAll({ includeUncontrolled: true, type: "window" })) cl.postMessage(Object.assign({ kp: "update" }, m));
}
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
     try {
      const c = await caches.open(CACHE);
      const old = await getMan(c, MANIFEST);
      const migrate = !Object.keys(old).length;
      // 1) 화면 + 꼭 필요한 파일: 전부 받은 것을 확인한 뒤에만 저장 (중간에 실패하면 아무것도 안 바꿈 → 옛 버전 그대로)
      const page = await Promise.all(ALWAYS.map(async (f) => {
        const r = await fetch(req(f));
        const t = r.ok ? await r.clone().text() : "";
        if (!t.includes("kp:" + VERSION)) throw new Error(f + " 이 버전 화면이 아님"); // 와이파이 로그인 화면·옛 화면 방지
        return [f, r];
      }));
      const core = Object.entries(CORE);
      const extra = Object.entries(EXTRA);
      const total = core.length + extra.length;
      let done = 0,
        changed = 0,
        fetched = 0,
        bytes = 0;
      const count = (r) => {
        if (r && r.kpNet !== undefined) {
          fetched++;
          bytes += r.kpNet;
        }
      };
      const got = [];
      for (let i = 0; i < core.length; i += 8) {
        const rs = await Promise.all(core.slice(i, i + 8).map(([u, h]) => need(c, old, u, h, false)));
        rs.forEach((r, k) => {
          if (r) got.push([core[i + k][0], r]);
          count(r);
        });
        done += rs.length;
        changed = got.length;
        await tell({ phase: "progress", done, total, changed, fetched, bytes });
      }
      for (const [u, r] of got) await c.put(u, r);
      for (const [f, r] of page) await c.put(f, r);
      // 2) 그림·폰트 (실패해도 계속). 바뀐 파일을 못 받으면 옛 것을 지워 쓸 때 새로 받게
      const man = Object.assign({}, CORE);
      for (let i = 0; i < extra.length; i += 8) {
        const part = extra.slice(i, i + 8);
        const rs = await Promise.allSettled(part.map(([u, h]) => need(c, old, u, h, migrate)));
        for (let k = 0; k < part.length; k++) {
          const [u, h] = part[k];
          if (rs[k].status === "fulfilled") {
            if (rs[k].value) {
              count(rs[k].value);
              await c.put(u, rs[k].value);
              changed++;
            }
            man[u] = h;
          } else if (old[u] && old[u] !== h) await c.delete(u);
        }
        done += part.length;
        await tell({ phase: "progress", done, total, changed, fetched, bytes });
      }
      await c.put(PREV, jres(old));
      await c.put(MANIFEST, jres(man));
      // 옛 방식 저장소(kids-playground-버전)는 새 방식으로 한 번 바뀐 다음 업데이트 때 지움 (열려 있던 옛 화면 보호)
      if (!migrate) for (const k of await caches.keys()) if (k.startsWith("kids-playground-")) await caches.delete(k);
      await self.skipWaiting();
      await tell({ phase: "ready", changed, fetched, bytes, version: VERSION });
     } catch (err) {
      await tell({ phase: "fail" });
      throw err; // 설치 실패 → 옛 버전 그대로
     }
    })()
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      // 옛 음성 저장소 지우기
      for (const k of await caches.keys()) if (k !== CACHE && k !== VOICE_CACHE && !k.startsWith("kids-playground-")) await caches.delete(k);
      // 이번 목록과 직전 버전 목록 어디에도 없는 파일만 지움
      const c = await caches.open(CACHE);
      const keep = new Set([...KNOWN, ...Object.keys(await getMan(c, PREV)).map(abs), abs(MANIFEST), abs(PREV)]);
      for (const r of await c.keys()) if (!keep.has(r.url)) await c.delete(r);
      await self.clients.claim();
    })()
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // 화면(html)은 인터넷 우선 → 새 버전 즉시 반영, 나머지는 저장본 우선 → 빠르고 오프라인 가능
  // 단 3초 안에 답이 없으면(인터넷 안 되는 와이파이 등) 저장본으로 먼저 열고, 받는 건 계속해서 저장만
  if (e.request.mode === "navigate") {
    let saved = null;
    const net = fetch(e.request).then((r) => {
      // 정상 응답이고 '이 버전'의 화면일 때만 저장 (와이파이 로그인 화면·오류 페이지·다른 버전 저장 방지)
      if (r.ok && (r.headers.get("content-type") || "").includes("text/html")) {
        saved = r.clone().text().then((t) => { if (t.includes("kp:" + VERSION)) return caches.open(CACHE).then((c) => c.put("index.html", new Response(t, { headers: { "Content-Type": "text/html; charset=utf-8" } }))); });
      }
      return r;
    });
    e.waitUntil(net.then(() => saved).catch(() => {})); // 저장본으로 먼저 열어도 받기·저장은 끝까지
    e.respondWith(new Promise((resolve) => {
      let sent = false;
      const give = (r) => { if (!sent && r) { sent = true; resolve(r); } };
      const fromCache = () => caches.open(CACHE).then((c) => c.match("index.html")).then((r) => r || caches.match("index.html")); // 지금 저장소의 화면 먼저
      // 저장본이 없으면(첫 방문) 인터넷을 계속 기다림
      const t = setTimeout(() => fromCache().then(give), 3000);
      net.then((r) => { clearTimeout(t); give(r); }, () => { clearTimeout(t); fromCache().then((c) => give(c || Response.error())); });
    }));
    return;
  }
  // 정확히 같은 버전(?v=)이 있으면 저장본, 없으면 인터넷(새 버전), 인터넷도 안 되면 아무 버전 저장본
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok && KNOWN.has(url.href)) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })))
  );
});
