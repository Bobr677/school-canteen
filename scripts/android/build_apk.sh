#!/bin/bash
# Сборка ObedKlass.apk без Gradle: aapt2 → ecj → d8 → zipalign → apksigner
set -e

SDK=/home/z/android-sdk
BT=$SDK/bt/android-14
AJ=$SDK/plat/android-34/android.jar
PROJ=/home/z/my-project/scripts/android
OUT=$PROJ/build

rm -rf "$OUT"
mkdir -p "$OUT/gen" "$OUT/classes" "$OUT/dex"

echo "== 1. aapt2 compile =="
"$BT/aapt2" compile --dir "$PROJ/res" -o "$OUT/res.zip"

echo "== 2. aapt2 link =="
"$BT/aapt2" link -o "$OUT/base.apk" \
  -I "$AJ" \
  --manifest "$PROJ/AndroidManifest.xml" \
  -R "$OUT/res.zip" \
  --java "$OUT/gen" \
  --auto-add-overlay

echo "== 3. ecj compile =="
java -jar "$SDK/ecj.jar" -nowarn -proc:none \
  -source 1.8 -target 1.8 -encoding UTF-8 \
  -cp "$AJ" \
  -d "$OUT/classes" \
  "$PROJ/src/ru/obedklass/app/MainActivity.java" \
  "$OUT/gen/ru/obedklass/app/R.java"

echo "== 4. d8 dex =="
"$BT/d8" --release --lib "$AJ" \
  --output "$OUT/dex" \
  $(find "$OUT/classes" -name '*.class')

echo "== 5. add classes.dex =="
cd "$OUT/dex" && zip -q -u "$OUT/base.apk" classes.dex

echo "== 6. zipalign =="
"$BT/zipalign" -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"

echo "== 7. keystore =="
KS="$PROJ/obedklass.keystore"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -v -keystore "$KS" -storepass obedklass \
    -alias obedklass -keypass obedklass -keyalg RSA -keysize 2048 \
    -validity 10950 -dname "CN=ObedKlass, OU=School, O=ObedKlass, L=Moscow, C=RU"
fi

echo "== 8. sign =="
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:obedklass \
  --key-pass pass:obedklass --out "$OUT/ObedKlass.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify --print-certs "$OUT/ObedKlass.apk" | head -5

echo "== DONE =="
ls -la "$OUT/ObedKlass.apk"
