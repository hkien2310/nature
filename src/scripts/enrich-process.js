const fs = require('fs');
const path = require('path');

const targetsPath = path.join(__dirname, '../../targets.json');
const enrichPath = path.join(__dirname, 'temp-enrich.json');

if (!fs.existsSync(targetsPath)) {
  console.error("targets.json not found!");
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
const targets = fileData.targets;

const enriched = targets.map(c => {
  const newC = { ...c };
  newC.enrichment_count = (c.enrichment_count || 0) + 1;

  if (c.id === 'honey-badger') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["mật ong", "ấu trùng ong", "rắn độc", "bò sát nhỏ", "gặm nhấm", "côn trùng", "củ quả"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 7;
    newC.lifespan_max = 24;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Thời gian mang thai kéo dài từ 6 đến 10 tuần, thường đẻ 1 hoặc 2 con non. Con non sinh ra mù và không lông, hoàn toàn phụ thuộc vào mẹ. Con mẹ nuôi dưỡng và dạy kỹ năng săn mồi cho con non trong hang đất tự đào suốt 12-16 tháng trước khi chúng tự lập.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 30.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 550.0;
    newC.size_max_mm = 770.0;
    newC.weight_avg_g = 12000.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống cơ cổ và khớp vai phát triển cực kỳ mạnh mẽ, cung cấp lực mô-men xoắn lớn cho phép đào bới nhanh qua đất nén đá cứng.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng da dày đàn hồi để phân tán áp lực răng cắn của dã thú và giảm chấn thương khi bị ngã từ trên cao.";
    newC.unique_traits = (c.unique_traits || "") + " Đột biến đặc hiệu trên thụ thể acetylcholin nAChR loại bỏ điện tích âm ở vị trí gắn toxin của rắn độc, biến chúng thành lớp giáp sinh hóa chống độc tố thần kinh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.toxicon.2015.09.012",
        "label": "Toxicon - Honey badger resistance to snake venoms"
      },
      {
        "url": "https://www.iucnredlist.org/species/12814/45222300",
        "label": "IUCN Red List of Threatened Species - Mellivora capensis"
      }
    ];

  } else if (c.id === 'hooded-pitohui') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["bọ cánh cứng Choresine", "côn trùng nhỏ", "quả mọng", "hạt cây", "sung rừng"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 5;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Mùa sinh sản từ tháng 10 đến tháng 2 năm sau. Tổ chim được làm bằng dây leo, lá khô có dạng hình chén treo trên các cành cây thấp. Con cái đẻ khoảng 1-2 quả trứng. Cả bố và mẹ đều tham gia ấp trứng và nuôi con. Trứng và tổ cũng có chứa lượng độc tố batrachotoxin nhẹ để bảo vệ khỏi các loài gặm nhấm.';
    newC.locomotion = 'fly';
    newC.speed_max = 35.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 220.0;
    newC.size_max_mm = 230.0;
    newC.weight_avg_g = 70.0;

    newC.characteristics = (c.characteristics || "") + " Các tuyến dầu ở phao câu tiết chất béo hòa tan batrachotoxin, giúp phủ đều độc tố lên toàn bộ bề mặt lông khi rỉa cánh.";
    newC.survival_method = (c.survival_method || "") + " Chim non mới nở phát triển nhanh các đốm lông cảnh báo và sớm hấp thụ độc tố truyền từ tổ và thức ăn của bố mẹ.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu các protein liên kết độc tố (toxin-binding proteins) trong huyết thanh giúp vận chuyển batrachotoxin một cách an toàn mà không ảnh hưởng cơ tim.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1073/pnas.97.24.12970",
        "label": "PNAS - Batrachotoxin alkaloids in passerine birds"
      },
      {
        "url": "https://www.iucnredlist.org/species/22705572/94000305",
        "label": "IUCN Red List - Pitohui dichrous"
      }
    ];

  } else if (c.id === 'horror-frog') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["bọ cánh cứng", "nhện", "ốc sên", "côn trùng nước", "nòng nọc", "giun đất"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 3;
    newC.lifespan_max = 8;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Quá trình thụ tinh ngoài diễn ra dưới nước. Con cái đẻ trứng bám vào đá ở những dòng suối chảy xiết. Con đực mọc ra các xúc tu da (lông giả) giàu mạch máu để tăng khả năng hấp thụ oxy, cho phép nó ở lại dưới đáy nước sâu bảo vệ ổ trứng trong nhiều tuần liên tiếp mà không cần nổi lên bề mặt lấy khí.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 8.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 80.0;
    newC.size_max_mm = 130.0;
    newC.weight_avg_g = 125.0;

    newC.characteristics = (c.characteristics || "") + " Con đực sở hữu túi thanh quản kép dưới cổ họng có khả năng cộng hương âm tần phát tín hiệu trầm ấm gọi bạn tình xuyên qua tiếng suối chảy.";
    newC.survival_method = (c.survival_method || "") + " Tiết dịch nhầy nhầy giàu mucin làm giảm độ ma sát thủy động học khi trốn thoát dưới các dòng suối xiết.";
    newC.unique_traits = (c.unique_traits || "") + " Tế bào gốc mô liên kết tại vùng đầu xương ngón chân có hoạt tính phân bào cực mạnh, đẩy nhanh tốc độ biểu mô hóa và phục hồi khớp bị bẻ gãy.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1098/rsbl.2007.0659",
        "label": "Biology Letters - Wolverine frogs: Bony claws and chemical defense"
      },
      {
        "url": "https://www.iucnredlist.org/species/58019/184411130",
        "label": "IUCN Red List - Trichobatrachus robustus status"
      }
    ];

  } else if (c.id === 'humpback-anglerfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá biển sâu", "tôm giáp xác", "mực nhỏ", "nhuyễn thể chân đầu", "cá lồng đèn nhỏ"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 10;
    newC.lifespan_max = 20;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Con đực có kích thước cực nhỏ và không ký sinh vĩnh viễn (giao phối tạm thời hoặc tự do trong loài này). Chúng định vị con cái qua khứu giác nhạy bén nhận diện pheromone và thị giác nhạy quang thu tín hiệu esca phát sáng. Sau khi thụ tinh ngoài, trứng nổi lên tầng nước ấm mặt để nở thành ấu trùng trước khi chìm dần xuống vùng nước sâu.';
    newC.locomotion = 'swim';
    newC.speed_max = 5.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 100.0;
    newC.size_max_mm = 200.0;
    newC.weight_avg_g = 500.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống đường bên (lateral line) dọc thân cực nhạy cảm với các rung động cơ học tần số cực thấp dưới 10 Hz.";
    newC.survival_method = (c.survival_method || "") + " Cơ thể thiếu túi mật và bóng hơi giúp cân bằng áp suất thẩm thấu nội bào ở độ sâu lên đến 4.000m.";
    newC.unique_traits = (c.unique_traits || "") + " Enzym luciferase và cơ chất luciferin trong túi esca được sản xuất độc quyền bởi loài vi khuẩn cộng sinh Photobacterium, giúp duy trì ánh sáng xanh lục quyến rũ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1126/science.aar3233",
        "label": "Science - Deep-sea anglerfish evolution and sexual parasitism"
      },
      {
        "url": "https://www.iucnredlist.org/species/155106/177969396",
        "label": "IUCN Red List - Melanocetus johnsonii"
      }
    ];

  } else if (c.id === 'immortal-jellyfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["sinh vật phù du", "trứng cá", "ấu trùng giáp xác", "nhuyễn thể nhỏ", "sứa nhỏ khác"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 1;
    newC.lifespan_max = 999;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Chu trình sinh sản kép đặc biệt. Sinh sản hữu tính ở dạng sứa medusa trưởng thành giải phóng tinh trùng/trứng vào nước để tạo ấu trùng planula. Ấu trùng bám đáy phát triển thành cụm polyp phân nhánh sinh sản vô tính qua quá trình nảy chồi giải phóng sứa medusa mới. Khi bị stress, medusa kích hoạt đảo ngược vòng đời (reversal) quay về dạng polyp để bắt đầu lại.';
    newC.locomotion = 'swim';
    newC.speed_max = 1.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 4.5;
    newC.size_max_mm = 5.0;
    newC.weight_avg_g = 0.01;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc vành chuông cơ dọc có khả năng đàn hồi co bóp nhịp nhàng tạo áp suất thủy lực đẩy sứa tiến lên yếu ớt.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng dòng đối lưu đại dương để phân tán quần thể polyp đi khắp thế giới mà không tiêu tốn năng lượng bơi.";
    newC.unique_traits = (c.unique_traits || "") + " Sự điều hòa ngược các gen kiểm soát methyl hóa histone và chromatin (như Polycomb Group) trong quá trình chuyển biệt hóa tế bào tái thiết lập độ tuổi sinh học về không.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.cell.2022.09.009",
        "label": "Cell - Comparative genomics of Turritopsis dohrnii immortality"
      },
      {
        "url": "https://doi.org/10.1093/gbe/evab136",
        "label": "Genome Biology and Evolution - Cellular reprogramming in immortal jellyfish"
      }
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
