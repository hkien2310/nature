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

  if (c.id === 'mariana-snailfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["giáp xác amphipods", "giáp xác isopods", "giáp xác nhỏ chân khớp"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 3;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng hữu tính (oviparous), trứng có kích thước khổng lồ so với cơ thể (đường kính lên tới 9.4mm) để chứa nhiều lòng đỏ cung cấp đủ dinh dưỡng trong môi trường khắc nghiệt. Con non sinh sống khoảng 2 năm đầu ở độ sâu nông hơn trước khi di cư xuống đáy vực sâu Hadal.';
    newC.locomotion = 'swim';
    newC.speed_max = 5.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 100.0;
    newC.size_max_mm = 288.0;
    newC.weight_avg_g = 120.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống điều hòa thẩm thấu nội bào thích ứng hoàn hảo với áp suất cực đại nhờ nồng độ các hạt chất osmolytes phong phú.";
    newC.survival_method = (c.survival_method || "") + " Phân tích dạ dày cho thấy chúng tận dụng các dòng đối lưu Hadal để định vị thức ăn rơi từ tầng mặt xuống rãnh đáy sâu.";
    newC.unique_traits = (c.unique_traits || "") + " Sự biểu hiện gia tăng của các chaperone gấp nếp protein giúp duy trì cấu trúc không gian của đại phân tử sinh học dưới áp suất lớn.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1093/gbe/evac028",
        "label": "Genome Biology and Evolution - Snailfish Hadal Adaptation Genes"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù sống ở vùng siêu thẳm, phân tích dạ dày cho thấy chúng ăn rất no nê và không hề bị đói nhờ mật độ giáp xác dày đặc dưới đáy rãnh."
    ];

  } else if (c.id === 'mantis-shrimp') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cua", "ốc biển", "hàu", "sò", "cá nhỏ"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 4;
    newC.lifespan_max = 7;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ một khối trứng lớn chứa hàng ngàn quả trứng, ôm chặt trước ngực để bảo vệ, làm sạch và thường xuyên sục khí trong 2-3 tuần cho đến khi trứng nở thành ấu trùng tự do.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 10.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 180.0;
    newC.size_max_mm = 380.0;
    newC.weight_avg_g = 100.0;

    newC.characteristics = (c.characteristics || "") + " Càng của chúng còn được bọc ngoài bằng lớp tinh thể khoáng hydroxyapatite mật độ cao, cứng tương đương một số loại gốm kỹ thuật hiện đại.";
    newC.survival_method = (c.survival_method || "") + " Chúng luôn cảnh giác cao độ và có thể nhận biết được chuyển động của nước thông qua các râu cảm giác siêu nhạy.";
    newC.unique_traits = (c.unique_traits || "") + " Sự kết hợp độc đáo giữa chitin và các protein dẻo giúp lớp giáp của chúng chống mỏi cơ học tốt hơn bất kỳ loài giáp xác nào khác.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1126/science.1218344",
        "label": "Science - The Helicoidal Structure of the Mantis Shrimp Dactyl Club"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mắt của tôm bọ ngựa có khả năng di chuyển linh hoạt theo 6 chiều tự do giúp chúng quét môi trường xung quanh không góc chết."
    ];

  } else if (c.id === 'leopard-seal') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["chim cánh cụt hoàng đế", "hải cẩu nhỏ", "nhuyễn thể krill", "cá biển", "mực đại dương"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 12;
    newC.lifespan_max = 26;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Đẻ con. Sau thời gian mang thai 9 tháng, hải cẩu cái đẻ một con non duy nhất trên lớp băng nổi vào mùa hè Nam Cực. Nuôi con bằng sữa mẹ giàu chất béo trong khoảng 4 tuần trước khi tự lập.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 40.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 2400.0;
    newC.size_max_mm = 3500.0;
    newC.weight_avg_g = 435000.0;

    newC.characteristics = (c.characteristics || "") + " Râu của chúng rất cứng cáp, đóng vai trò như các cảm biến dòng chảy cực kỳ nhạy bén.";
    newC.survival_method = (c.survival_method || "") + " Chúng còn có thể giảm lượng tiêu thụ oxy tới 90% khi thực hiện các chuyến lặn dài dưới thềm băng dày.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng tự kích hoạt cơ chế chống đông máu trong thời gian lặn sâu kéo dài ngăn nghẽn mạch.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1371/journal.pone.0227188",
        "label": "PLOS ONE - Leopard Seal Diet and Foraging Patterns in Antarctica"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù là loài săn mồi đáng sợ, hải cẩu báo lại rất tò mò đối với thợ lặn và thường tiếp cận gần để quan sát thiết bị máy ảnh."
    ];

  } else if (c.id === 'lionfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "tôm nhỏ", "cua", "ấu trùng giáp xác"];
    newC.activity_pattern = 'crepuscular';
    newC.lifespan_min = 10;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng. Giao phối quanh năm. Con cái đẻ cặp túi trứng nhầy nổi tự do chứa từ 15.000 đến 30.000 quả trứng mỗi 2-3 ngày. Trứng nở thành ấu trùng sau 36 giờ.';
    newC.locomotion = 'swim';
    newC.speed_max = 2.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 300.0;
    newC.size_max_mm = 380.0;
    newC.weight_avg_g = 1250.0;

    newC.characteristics = (c.characteristics || "") + " Các xương gai của chúng có tính chất cơ học cứng cao nhưng rỗng ruột để chứa tối đa lượng độc tố khi cần phóng thích.";
    newC.survival_method = (c.survival_method || "") + " Ngoài ra, chúng có khả năng phát ra sóng áp lực nước bằng cách rung nhẹ bong bóng bơi để dồn ép con mồi.";
    newC.unique_traits = (c.unique_traits || "") + " Hệ thống tiêu hóa có tốc độ xử lý enzyme cực cao phân giải protein con mồi trong thời gian ngắn.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.3389/fmars.2020.573123",
        "label": "Frontiers in Marine Science - Lionfish Invasion and Ecological Impacts"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Cá sư tử có thể thích nghi và sống tốt trong môi trường nước lợ tại các cửa sông lớn, mở rộng đáng kể ranh giới sinh tồn."
    ];

  } else if (c.id === 'lions-mane-jellyfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["sứa nhỏ", "sinh vật phù du", "cá nhỏ", "tôm nhỏ"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 1;
    newC.lifespan_max = 1;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Vòng đời xen kẽ thế hệ. Giai đoạn sứa trưởng thành sinh sản hữu tính giải phóng trứng và tinh trùng. Ấu trùng bám đáy phát triển thành polyp, sau đó polyp nhân bản vô tính đâm chồi giải phóng sứa non.';
    newC.locomotion = 'swim';
    newC.speed_max = 1.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 1500.0;
    newC.size_max_mm = 2100.0;
    newC.weight_avg_g = 150000.0;

    newC.characteristics = (c.characteristics || "") + " Thân chuông của chúng được cấu thành từ 99% nước biển, tích lũy lượng lớn ion amoni làm giảm tỷ trọng cơ thể để dễ nổi.";
    newC.survival_method = (c.survival_method || "") + " Chúng sử dụng cơ chế co thắt chuông đồng đều để di chuyển dọc cột nước tìm kiếm vùng nước giàu dinh dưỡng.";
    newC.unique_traits = (c.unique_traits || "") + " Protein độc tố cyanea có cấu trúc liên kết chéo đặc biệt, có khả năng kích hoạt phản ứng dị ứng tức thì ở da của động vật săn mồi.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1007/s00227-017-3209-6",
        "label": "Marine Biology - Population Dynamics of Cyanea capillata"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Khi tụ họp với mật độ cực cao vào cuối mùa hè, hàng ngàn cá thể sứa bờm sư tử có thể tạo thành một dải ruy băng màu đỏ thẫm kéo dài hàng cây số trên biển."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
