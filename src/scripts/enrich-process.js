const fs = require('fs');
const path = require('path');

const targetsPath = path.join(__dirname, 'temp-targets.json');
const enrichPath = path.join(__dirname, 'temp-enrich.json');

if (!fs.existsSync(targetsPath)) {
  console.error("temp-targets.json not found!");
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
const targets = fileData.targets;

const enriched = targets.map(c => {
  const newC = { ...c };
  newC.enrichment_count = c.enrichment_count + 1;

  if (c.id === 'hairy-frog') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["côn trùng", "nhện", "giáp xác", "sên", "động vật nhỏ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 5;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Con cái đẻ trứng vào nước ở các con suối chảy nhanh, trứng bám vào đá. Con đực ở lại canh gác trứng dưới nước và sử dụng các sợi nhú da hô hấp để nhịn thở lâu.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 8.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 80.0;
    newC.size_max_mm = 130.0;
    newC.weight_avg_g = 140.0;
  } else if (c.id === 'hairy-frogfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "tôm", "cua", "giáp xác"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 3;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Giao phối bơi lên mặt nước, con cái đẻ một bè trứng (raft of eggs) lớn trôi nổi chứa hàng ngàn quả trứng nhỏ thụ tinh ngoài.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 4.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 100.0;
    newC.size_max_mm = 220.0;
    newC.weight_avg_g = 200.0;
  } else if (c.id === 'harpy-eagle') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["lười", "khỉ", "kỳ đà", "chim lớn", "gấu túi coatimundi"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 25;
    newC.lifespan_max = 35;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = "Sinh sản hữu tính. Một vợ một chồng, đẻ 1-2 quả trứng nhưng chỉ nuôi 1 con non duy nhất sống sót. Chu kỳ sinh sản kéo dài từ 2 đến 3 năm.";
    newC.locomotion = 'fly';
    newC.speed_max = 80.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 860.0;
    newC.size_max_mm = 1000.0;
    newC.weight_avg_g = 6500.0;
  } else if (c.id === 'hercules-beetle') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["trái cây chín rữa", "nhựa cây", "gỗ mục (ấu trùng)"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 2;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Con cái đẻ khoảng 100 quả trứng trực tiếp vào gỗ mục hoặc đất mùn. Ấu trùng trải qua 3 giai đoạn lột xác trước khi hóa nhộng.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 5.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 50.0;
    newC.size_max_mm = 175.0;
    newC.weight_avg_g = 110.0;
  } else if (c.id === 'hippopotamus') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["cỏ ngắn", "thực vật thủy sinh", "chồi non"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 40;
    newC.lifespan_max = 50;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = "Đẻ con. Con cái mang thai khoảng 8 tháng, đẻ một con non duy nhất dưới nước. Con non có thể bú mẹ dưới nước và biết bơi ngay khi sinh.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 30.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 2900.0;
    newC.size_max_mm = 5000.0;
    newC.weight_avg_g = 2000000.0;
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
