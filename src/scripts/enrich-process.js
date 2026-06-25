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

  if (c.id === 'leafy-seadragon') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["tôm mysis", "tôm nhỏ", "ấu trùng cá", "sinh vật phù du nhỏ"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 7;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Con cái đẻ trứng và chuyển sang dán chặt dưới nếp gấp da chứa nhiều mao mạch ở phần đuôi của con đực. Con đực mang thai nuôi dưỡng trứng trong 4-9 tuần trước khi nở thành hải long con tự lập.";
    newC.locomotion = 'swim';
    newC.speed_max = 0.15;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 300.0;
    newC.size_max_mm = 350.0;
    newC.weight_avg_g = 100.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Mật độ thụ thể ánh sáng trên võng mạc cực cao giúp phát hiện chuyển động siêu nhỏ của con mồi.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng dòng chảy thủy triều nhẹ để di chuyển tầm xa mà không tiêu tốn năng lượng.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng định vị âm thanh truyền qua nước để cảm nhận sự tiếp cận của động vật săn mồi từ xa.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.montereybayaquarium.org/animals/animals-a-to-z/leafy-seadragon",
        "label": "Monterey Bay Aquarium - Leafy Seadragon Profile"
      }
    ];
    newC.strengths = [
      ...(c.strengths || []),
      "Thải phân dạng lỏng trôi nhanh không để lại dấu vết mùi hương dẫn dụ kẻ thù"
    ];
    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Tỷ lệ sống sót của cá con ngoài tự nhiên cực kỳ thấp (dưới 2%)"
    ];
    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Cá con mới nở đã có khả năng tự ngụy trang ngay lập tức bằng các phần phụ da nhỏ bé giống hệt tảo non."
    ];

  } else if (c.id === 'leopard-seal') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["chim cánh cụt hoàng đế", "hải cẩu nhỏ", "nhuyễn thể krill", "cá biển", "mực đại dương"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 12;
    newC.lifespan_max = 26;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = "Đẻ con. Sau thời gian mang thai 9 tháng, hải cẩu cái đẻ một con non duy nhất trên lớp băng nổi vào mùa hè Nam Cực. Nuôi con bằng sữa mẹ giàu chất béo trong khoảng 4 tuần trước khi tự lập.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 40.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 2400.0;
    newC.size_max_mm = 3500.0;
    newC.weight_avg_g = 435000.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Lớp mỡ dày dưới da (blubber) vừa giữ nhiệt vừa hoạt động như một lớp giáp chống lại các vết cắn nông từ kẻ thù.";
    newC.survival_method = (c.survival_method || "") + " Khả năng điều hòa nhịp tim giảm mạnh (bradycardia) khi lặn giúp tiết kiệm oxy tối đa.";
    newC.unique_traits = (c.unique_traits || "") + " Cơ hàm có cấu trúc cơ liên kết cực khỏe tạo lực cắn lên tới hàng ngàn Newton để nghiền xương.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.antarctica.gov.au/about-antarctica/animals/seals/leopard-seals/",
        "label": "Australian Antarctic Division - Leopard Seal Ecology"
      }
    ];
    newC.strengths = [
      ...(c.strengths || []),
      "Cơ hàm khỏe tạo lực cắn lên tới hàng ngàn Newton kết hợp răng nanh sắc bén kết liễu mồi nhanh gọn"
    ];
    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Cơ thể cồng kềnh khó di chuyển nhanh trên cạn, dễ bị kiệt sức nếu mắc cạn trên bờ cát dài"
    ];
    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Hải cẩu báo đực thường dành hàng giờ dưới nước hát những bài hát trầm ấm để bảo vệ lãnh thổ và tán tỉnh con cái."
    ];

  } else if (c.id === 'lionfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "tôm nhỏ", "cua", "ấu trùng giáp xác"];
    newC.activity_pattern = 'crepuscular';
    newC.lifespan_min = 10;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Giao phối quanh năm. Con cái đẻ cặp túi trứng nhầy nổi tự do chứa từ 15.000 đến 30.000 quả trứng mỗi 2-3 ngày. Trứng nở thành ấu trùng sau 36 giờ.";
    newC.locomotion = 'swim';
    newC.speed_max = 2.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 300.0;
    newC.size_max_mm = 380.0;
    newC.weight_avg_g = 1250.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Tuyến chất nhầy bao phủ biểu bì có chứa kháng sinh sinh học tự nhiên chống nấm và ký sinh trùng hiệu quả.";
    newC.survival_method = (c.survival_method || "") + " Chiến thuật săn mồi phối hợp theo nhóm nhỏ để ép đàn cá con vào các rạn đá hẹp.";
    newC.unique_traits = (c.unique_traits || "") + " Hệ gai độc có cơ chế van thủy lực ép nọc tự động chảy ra ngoài khi có áp lực cơ học ép vào.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.noaa.gov/education/resource-collections/ocean-coasts/invasive-species/lionfish",
        "label": "NOAA - Invasive Lionfish Control & Management"
      }
    ];
    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng phun tia nước nhỏ định hướng làm nhiễu cảm biến của con mồi trước khi hút chân không"
    ];
    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Rất nhạy cảm với nhiệt độ lạnh dưới 10°C, giới hạn sự lan rộng về các vùng biển cận ôn đới"
    ];
    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù là loài đơn độc, cá sư tử đôi khi hợp tác quây lưới vây ngực để săn đàn cá con hiệu quả gấp đôi."
    ];

  } else if (c.id === 'lions-mane-jellyfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["sứa nhỏ", "sinh vật phù du", "cá nhỏ", "tôm nhỏ"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 1;
    newC.lifespan_max = 1;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = "Vòng đời xen kẽ thế hệ. Giai đoạn sứa trưởng thành sinh sản hữu tính giải phóng trứng và tinh trùng. Ấu trùng bám đáy phát triển thành polyp, sau đó polyp nhân bản vô tính đâm chồi giải phóng sứa non.";
    newC.locomotion = 'swim';
    newC.speed_max = 1.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 1500.0;
    newC.size_max_mm = 2100.0;
    newC.weight_avg_g = 150000.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Hệ cơ chuông có cấu trúc mô liên kết gelatin siêu đàn hồi giúp phục hồi hình dạng tức thì sau mỗi nhịp co bóp.";
    newC.survival_method = (c.survival_method || "") + " Tự ngụy trang cơ thể bằng cách làm mờ màu sắc cơ thể tiệp màu với nền nước biển sâu lạnh giá.";
    newC.unique_traits = (c.unique_traits || "") + " Các túi châm độc giải phóng nọc chứa độc tố polypeptide có khả năng kháng nhiệt nhẹ giúp giữ hoạt tính lâu hơn.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.jellywatch.org/species/cyanea_capillata",
        "label": "Jellywatch Species Profile - Cyanea capillata"
      }
    ];
    newC.strengths = [
      ...(c.strengths || []),
      "Nọc độc Cyanea peptide có tính hướng tim cực mạnh gây rối loạn tuần hoàn lập tức ở con mồi"
    ];
    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Cơ thể quá mỏng manh dễ bị phá hủy bởi các chân vịt tàu thuyền hoặc lưới đánh cá"
    ];
    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chúng có thể sống cộng sinh với một số loài cá nhỏ nhờ lớp chất nhầy bảo vệ đặc biệt giúp cá không bị châm độc."
    ];

  } else if (c.id === 'mantis-shrimp') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cua", "ốc biển", "hàu", "sò", "cá nhỏ"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 4;
    newC.lifespan_max = 7;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Con cái đẻ một khối trứng lớn chứa hàng ngàn quả trứng, ôm chặt trước ngực để bảo vệ, làm sạch và thường xuyên sục khí trong 2-3 tuần cho đến khi trứng nở thành ấu trùng tự do.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 10.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 180.0;
    newC.size_max_mm = 380.0;
    newC.weight_avg_g = 100.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Hệ cơ của búa đập có cấu trúc sợi cơ giật nhanh loại II siêu đặc biệt hỗ trợ giải phóng lực bùng nổ tức thì.";
    newC.survival_method = (c.survival_method || "") + " Đào hang sâu kết hợp gia cố vách hang bằng các mảnh vụn san hô liên kết bằng chất nhầy cơ thể.";
    newC.unique_traits = (c.unique_traits || "") + " Hệ cơ quang học trong mắt cho phép quét tần số phân cực tròn của ánh sáng độc nhất vô nhị.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.nature.com/articles/nmat3303",
        "label": "Nature Materials - Bouligand structure of mantis shrimp club"
      }
    ];
    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng nhận biết phân cực tròn của ánh sáng để giao tiếp riêng tư mà không bị phát hiện"
    ];
    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Quá trình hồi phục càng dập sau mỗi lần lột xác tốn nhiều canxi và năng lượng cốt lõi"
    ];
    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mắt tôm bọ ngực có tới 3 vùng tập trung tiêu cự trên một con mắt đơn, cho phép nhìn lập thể ba chiều mà không cần con mắt còn lại."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
