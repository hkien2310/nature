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

  if (c.id === 'naked-mole-rat') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["củ cây dưới đất", "rễ cây", "thân hành", "mô thực vật ngầm"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 10;
    newC.lifespan_max = 31;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính có tính xã hội cao (eusocial). Chỉ một con chuột chúa (queen) phối giống với 1-3 con đực được chọn trong đàn. Chuột chúa có thể đẻ tới 4-5 lứa mỗi năm, mỗi lứa từ 11 đến 28 con non, thời gian mang thai khoảng 66-77 ngày.';
    newC.locomotion = 'burrow';
    newC.speed_max = 2.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 80.0;
    newC.size_max_mm = 100.0;
    newC.weight_avg_g = 35.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống cơ xương hàm phát triển cực thịnh với các sợi cơ sọc chéo tối ưu hóa lực mô-men xoắn khi đào đất sét nén.";
    newC.survival_method = (c.survival_method || "") + " Nhịp thở thích ứng sâu giúp chúng chịu được nồng độ carbon dioxide lên tới 10% mà không bị toan hóa máu.";
    newC.unique_traits = (c.unique_traits || "") + " Cấu trúc ribosome đặc biệt có RNA ribosom 28S bị cắt đôi giúp tăng độ chính xác của quá trình dịch mã protein.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.cell.2020.03.025",
        "label": "Cell - Ribosome Profiling and Translation Accuracy in Naked Mole-Rats"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chuột chũi trần trụi có thể di chuyển lùi nhanh bằng đi tiến nhờ hệ thống lông xúc giác phân bố đều quanh thân."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Ribosome có cấu trúc đột phá dịch mã cực chuẩn giảm protein lỗi tích lũy"
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Hoàn toàn mất khả năng run rẩy tạo nhiệt khi nhiệt độ phòng tụt dốc"
    ];

  } else if (c.id === 'namib-desert-beetle') {
    newC.diet_type = 'detritivore';
    newC.diet_items = ["chất hữu cơ mục nát", "mảnh vụn thực vật", "xác côn trùng nhỏ thổi trong cát"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 2;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Sau khi thụ tinh, con cái đào các rãnh nông dưới lớp cát mát hơn để đẻ trứng. Ấu trùng trải qua nhiều giai đoạn lột xác dưới lòng cát ẩm trước khi hóa nhộng.';
    newC.locomotion = 'walk';
    newC.speed_max = 3.6;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 10.0;
    newC.size_max_mm = 20.0;
    newC.weight_avg_g = 0.1;

    newC.characteristics = (c.characteristics || "") + " Bề mặt các nốt sần không có sáp, cho phép nước đọng bám dính nhanh chóng khi sương mù đi qua.";
    newC.survival_method = (c.survival_method || "") + " Góc nghiêng 45 độ được điều chỉnh tối ưu theo hướng gió để tạo ra lực cản khí động học tối thiểu.";
    newC.unique_traits = (c.unique_traits || "") + " Lớp biểu bì sáp kỵ nước chứa các este axit béo chuỗi dài giúp ngăn chặn triệt để sự thất thoát nước qua hô hấp ngoài vỏ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1103/PhysRevE.77.061915",
        "label": "Physical Review E - Fog harvesting mechanisms on beetle-inspired surfaces"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chúng có thể phát hiện các luồng khí ẩm từ Đại Tây Dương từ khoảng cách nhiều km nhờ các thụ thể độ ẩm trên râu."
    ];

  } else if (c.id === 'narwhal') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá tuyết Bắc Cực", "cá bơn Greenland", "mực ống", "tôm biển sâu"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 30;
    newC.lifespan_max = 50;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, đẻ con (viviparous). Thời gian mang thai kéo dài 14-15 tháng. Mỗi lứa đẻ một con non duy nhất. Kỳ lân biển con có màu xám xanh đậm và được mẹ bảo vệ nghiêm ngặt dọc theo các rìa băng.';
    newC.locomotion = 'swim';
    newC.speed_max = 20.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 3950.0;
    newC.size_max_mm = 5500.0;
    newC.weight_avg_g = 1200000.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống mạch máu ở tủy răng nối thẳng tới hệ tuần hoàn chính giúp cảm nhận biến thiên nhiệt độ nước tức thời.";
    newC.survival_method = (c.survival_method || "") + " Nhịp tim của chúng giảm xuống chỉ còn 10-20 nhịp/phút khi thực hiện lặn sâu vượt quá 1000m.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng định vị tiếng click của chúng có chùm tia định hướng hẹp nhất trong số tất cả các loài cá voi có răng.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1371/journal.pone.0110321",
        "label": "PLOS ONE - Extreme diving behavior and physiological responses of Monodon monoceros"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chiếc ngà của kỳ lân biển thực chất mọc lệch về bên trái, xoắn theo chiều ngược kim đồng hồ."
    ];

  } else if (c.id === 'ocean-sunfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["sứa", "salps", "sứa lược", "cá con", "ấu trùng giáp xác"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 10;
    newC.lifespan_max = 23;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính thụ tinh ngoài. Lớp trứng trôi nổi tự do trong nước biển ấm. Cá bột mới nở có những chiếc gai dài bảo vệ cơ thể giống như cá nóc gai.';
    newC.locomotion = 'swim';
    newC.speed_max = 3.2;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 1800.0;
    newC.size_max_mm = 3300.0;
    newC.weight_avg_g = 1500000.0;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc clavus được nâng đỡ bởi các tia vây biến tính tự do, tạo ra khả năng bẻ lái cơ động khi đối mặt với dòng chảy lớn.";
    newC.survival_method = (c.survival_method || "") + " Quá trình phơi nắng cũng giúp chúng tăng tốc độ tiêu hóa lượng sứa khổng lồ trong dạ dày nhờ nhiệt độ ấm.";
    newC.unique_traits = (c.unique_traits || "") + " Sự tăng trưởng kích thước từ lúc nở đến khi trưởng thành của cá mặt trăng đạt mức 60 triệu lần.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1093/icesjms/fsu191",
        "label": "ICES Journal of Marine Science - Mola mola movement patterns and thermal niche"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù có cơ thể khổng lồ, chúng chỉ có một bộ não rất nhỏ, nặng chưa đến 6 gram."
    ];

  } else if (c.id === 'ogre-faced-spider') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["dế", "kiến", "bướm đêm", "bọ cánh cứng nhỏ", "muỗi"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 2;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Sau giao phối, con cái dệt kén tơ chứa khoảng 100-200 trứng, bọc kín bằng một lớp tơ màu nâu ngụy trang giống như đất hoặc hạt cây khô trên các tán lá mục.';
    newC.locomotion = 'crawl';
    newC.speed_max = 1.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 20.0;
    newC.size_max_mm = 30.0;
    newC.weight_avg_g = 2.0;

    newC.characteristics = (c.characteristics || "") + " Tròng mắt của nhện mặt quỷ không có cơ điều tiết tiêu cự, tiêu cự được cố định tối ưu hóa cho khoảng cách quăng lưới chính xác từ 2 đến 5 cm.";
    newC.survival_method = (c.survival_method || "") + " Khi quăng lưới săn mồi dưới mặt đất, chúng sử dụng các đốm phân trắng làm vạch định vị để xác định góc quăng hoàn hảo.";
    newC.unique_traits = (c.unique_traits || "") + " Tơ của lưới săn mồi được chải bằng cơ quan cribellum tạo ra các sợi tơ cực kỳ tơi xốp quấn chặt lấy lông hoặc gai của côn trùng.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1242/jeb.228510",
        "label": "Journal of Experimental Biology - Sensory ecology of net-casting spiders"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Lưới săn mồi của chúng không hề dính nước mà dùng cấu trúc sợi tơ xốp mịn để bẫy mồi bằng lực ma sát cơ học."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
