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
  newC.enrichment_count = (c.enrichment_count || 0) + 1;

  if (c.id === 'peacock-mantis-shrimp') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cua", "ốc biển", "sò", "tôm nhỏ", "cá nhỏ"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 4;
    newC.lifespan_max = 6;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Con cái đẻ trứng thành một khối lớn màu hồng và ôm chặt trước ngực để bảo vệ, làm sạch trứng cho đến khi nở.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 10.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 30.0;
    newC.size_max_mm = 180.0;
    newC.weight_avg_g = 90.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Mắt kép phân chia 3 phần độc đáo chứa 10.000 mắt con ommatidia phân bổ dải giữa để cảm thụ ánh sáng phân cực.";
    newC.survival_method = (c.survival_method || "") + " Sử dụng cú đấm búa tạ tạo áp suất bong bóng âm để phá vỡ các cấu trúc phòng thủ cứng nhất.";
    newC.unique_traits = (c.unique_traits || "") + " Cơ cấu chốt cơ học (meral sclerite) tích lũy năng lượng cơ học đàn hồi như cánh cung dồn nén.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.nature.com/articles/413385a",
        "label": "Nature - Biomechanics: Prowess of a predatory shrimp"
      }
    ];

  } else if (c.id === 'peregrine-falcon') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["bồ câu", "chim sáo đá", "vịt trời", "dơi", "chim hải âu nhỏ"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 12;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Mỗi tổ thường có từ 3-4 quả trứng, được cả chim bố và chim mẹ thay phiên nhau ấp trong khoảng 33 ngày.";
    newC.locomotion = 'fly';
    newC.speed_max = 389.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 340.0;
    newC.size_max_mm = 580.0;
    newC.weight_avg_g = 1000.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Bộ lông xếp mượt khí động học làm giảm tối thiểu lực ma sát không khí khi lao dốc đứng.";
    newC.survival_method = (c.survival_method || "") + " Nghiêng đầu một góc 40 độ trong cú lao stoop để duy trì mục tiêu rõ ràng nhất trong tầm mắt.";
    newC.unique_traits = (c.unique_traits || "") + " Lỗ mũi có các gờ xương hình nón (tubercles) để phân tán luồng khí áp lực cao bảo vệ phổi.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1242/jeb.095398",
        "label": "Journal of Experimental Biology - Flight dynamics of peregrine falcon"
      }
    ];

  } else if (c.id === 'pistol-shrimp') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá hề nhỏ", "tôm nhỏ", "cua nhỏ", "giun biển", "nhuyễn thể"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 2;
    newC.lifespan_max = 3;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Trứng bám dưới bụng con cái cho đến khi nở thành ấu trùng bơi tự do trong nước biển.";
    newC.locomotion = 'crawl';
    newC.speed_max = 1.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 30.0;
    newC.size_max_mm = 50.0;
    newC.weight_avg_g = 25.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Khớp càng súng có cấu trúc đòn bẩy kẹp giữ chốt cơ học để giải phóng lực kẹp đột biến.";
    newC.survival_method = (c.survival_method || "") + " Thiết lập mối liên kết xúc giác liên tục bằng râu với cá bống cộng sinh canh hang.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng tạo sóng kích chấn (shockwave) truyền trong nước làm tê liệt hoặc vỡ vỏ con mồi từ xa.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1126/science.289.5488.2277",
        "label": "Science - How Snapping Shrimp Snap"
      }
    ];

  } else if (c.id === 'planarian-flatworm') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["giáp xác nhỏ", "giun nhỏ", "ấu trùng côn trùng nước", "ốc nhỏ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'hermaphrodite';
    newC.reproduction_notes = "Lưỡng tính. Có khả năng tự phân đôi cơ thể (fission) để sinh sản vô tính, hoặc giao phối chéo đẻ kén trứng.";
    newC.locomotion = 'crawl';
    newC.speed_max = 0.05;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 10.0;
    newC.size_max_mm = 20.0;
    newC.weight_avg_g = 0.03;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Tuyến hầu (pharynx) cơ học có thể thò ra ngoài từ giữa bụng để hút dinh dưỡng hóa lỏng.";
    newC.survival_method = (c.survival_method || "") + " Tự hủy một phần tế bào cơ thể qua apoptosis để thu nhỏ kích thước khi cạn kiệt thức ăn.";
    newC.unique_traits = (c.unique_traits || "") + " Hệ thống thần kinh tập trung phân tán chứa các neuropeptides kiểm soát khả năng phục hồi trí nhớ.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1126/science.1192321",
        "label": "Science - Planarian Regeneration and Stem Cells Study"
      }
    ];

  } else if (c.id === 'platypus') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["ấu trùng côn trùng", "tôm sông", "giun đất", "ốc nước ngọt", "cá nhỏ"];
    newC.activity_pattern = 'crepuscular';
    newC.lifespan_min = 10;
    newC.lifespan_max = 17;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = "Đẻ trứng. Con cái đẻ từ 1-3 quả trứng vỏ dẻo dai vào hang sâu ven bờ suối, ấp trứng bằng cách cuộn tròn người giữ ấm.";
    newC.locomotion = 'hybrid';
    newC.speed_max = 4.0;
    newC.conservation_status = 'NT';
    newC.size_min_mm = 400.0;
    newC.size_max_mm = 500.0;
    newC.weight_avg_g = 1500.0;

    // Enrich existing fields
    newC.characteristics = (c.characteristics || "") + " Cựa nọc độc dài ở chân sau kết nối trực tiếp với tuyến độc đùi hoạt động mạnh vào mùa sinh sản.";
    newC.survival_method = (c.survival_method || "") + " Nhắm kín mắt tai mũi khi lặn, dựa 100% vào hàng ngàn thụ thể điện từ trên da mỏ.";
    newC.unique_traits = (c.unique_traits || "") + " Bộ nhiễm sắc thể giới tính phức tạp gồm 10 chiếc (XYXYXYXYXY ở con trống) liên kết mật thiết.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.nature.com/articles/nature06936",
        "label": "Nature - Genome analysis of the platypus reveals unique signatures"
      }
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
