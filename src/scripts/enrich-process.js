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

  if (c.id === 'cape-buffalo') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["cỏ thô", "cỏ lá ngắn", "chồi non", "thảo mộc", "cây bụi"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 18;
    newC.lifespan_max = 22;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Thời gian mang thai khoảng 330-340 ngày (11 tháng), mỗi lứa chỉ đẻ 1 con non duy nhất. Con non có thể tự đứng dậy và di chuyển cùng bầy đàn sau vài giờ sinh.';
    newC.locomotion = 'walk';
    newC.speed_max = 57.0;
    newC.conservation_status = 'NT';
    newC.size_min_mm = 1700.0;
    newC.size_max_mm = 3400.0;
    newC.weight_avg_g = 700000.0;

    newC.characteristics = (c.characteristics || "") + " Lớp da dày kết hợp với cấu trúc cơ bắp cực kỳ phát triển bám chặt vào khung xương sườn lớn, tạo nên khả năng chịu đòn va đập vượt trội.";
    newC.survival_method = (c.survival_method || "") + " Hình thành cấu trúc bầy đàn phòng thủ vòng tròn khép kín, đưa con non vào giữa và đưa cặp sừng lớn ra ngoài tạo chiến lũy kiên cố chống lại động vật ăn thịt.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu bộ xương sọ và sừng dạng boss liên kết thành khiên xương dày, hấp thụ tối đa động năng của các cú va đập và bảo vệ vùng não hoàn hảo.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.iucnredlist.org/species/21174/125867375",
        "label": "IUCN Red List - Syncerus caffer Species Assessment"
      },
      {
        "url": "https://animaldiversity.org/accounts/Syncerus_caffer/",
        "label": "Animal Diversity Web - Cape Buffalo Biology"
      }
    ];

  } else if (c.id === 'cheetah') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["linh dương gazelle", "linh dương impala", "thỏ rừng", "hoẵng", "chim"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 10;
    newC.lifespan_max = 12;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Chu kỳ mang thai dao động từ 90 đến 95 ngày, đẻ một lứa gồm 3-5 con non. Báo mẹ đơn độc nuôi con và di chuyển ổ đẻ sau mỗi vài ngày để tránh kẻ thù phát hiện.';
    newC.locomotion = 'walk';
    newC.speed_max = 113.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 1100.0;
    newC.size_max_mm = 1500.0;
    newC.weight_avg_g = 46500.0;

    newC.characteristics = (c.characteristics || "") + " Cột sống hoạt động giống như một lò xo đàn hồi lớn, giãn dài và uốn cong tối đa để kéo dài sải chạy nước rút lên tới 7 mét.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng móng vuốt bán co rút tăng độ bám đất làm điểm tựa chịu lực ly tâm cực đại khi thực hiện cua lắt léo ở tốc độ trên 100 km/h.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu hệ thống phản xạ tiền đình - mắt (vestibulo-ocular reflex) giữ ánh nhìn ổn định tuyệt đối khóa chặt mục tiêu bất kể cơ thể rung lắc mạnh.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1038/nature12295",
        "label": "Nature Journal - Locomotion dynamics of hunting cheetahs"
      },
      {
        "url": "https://www.iucnredlist.org/species/219/115058047",
        "label": "IUCN Red List - Acinonyx jubatus Vulnerable status"
      }
    ];

  } else if (c.id === 'chinese-giant-salamander') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cua sông", "ếch", "cá suối", "côn trùng thủy sinh", "kỳ giông nhỏ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 40;
    newC.lifespan_max = 60;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Thụ tinh ngoài trong hang nước chảy. Con cái đẻ chuỗi gồm 400-500 trứng, con đực có vai trò bảo vệ tổ và quạt nước liên tục bằng đuôi để cung cấp dưỡng khí cho trứng suốt 2-3 tháng.';
    newC.locomotion = 'crawl';
    newC.speed_max = 5.0;
    newC.conservation_status = 'CR';
    newC.size_min_mm = 1150.0;
    newC.size_max_mm = 1800.0;
    newC.weight_avg_g = 37500.0;

    newC.characteristics = (c.characteristics || "") + " Các nếp gấp da nhăn nheo chạy dọc bên hông giúp gia tăng tối đa diện tích bề mặt tiếp xúc trực tiếp để hấp thụ oxy hòa tan trong nước.";
    newC.survival_method = (c.survival_method || "") + " Nhờ hệ cảm biến cơ học đường bên (neuromasts) phân bố đều quanh sọ giúp định vị chính xác dao động áp suất nước do con mồi gây ra trong bóng tối.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng tái sinh hoàn hảo các chi, đuôi, cơ và mô thần kinh bị mất nhờ cơ chế kích hoạt các tế bào gốc biểu bì chuyên biệt.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.cub.2018.08.017",
        "label": "Current Biology - Evolutionary History of Giant Salamanders"
      },
      {
        "url": "https://www.iucnredlist.org/species/1272/3375181",
        "label": "IUCN Red List - Andrias davidianus"
      }
    ];

  } else if (c.id === 'coconut-crab') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["dừa chín", "trái dại", "hạt", "xác thối động vật", "cua nhỏ khác"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 40;
    newC.lifespan_max = 60;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Giao phối trên cạn ven biển. Con cái đẻ và mang bọc trứng dưới bụng trong 4-5 tuần trước khi di chuyển xuống mép nước thả ấu trùng vào đại dương lúc triều cường.';
    newC.locomotion = 'walk';
    newC.speed_max = 5.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 150.0;
    newC.size_max_mm = 400.0;
    newC.weight_avg_g = 4000.0;

    newC.characteristics = (c.characteristics || "") + " Lớp vỏ kitin được gia cố vững chắc bằng hàm lượng khoáng canxi cacbonat cực cao hấp thụ từ nguồn thức ăn trên cạn.";
    newC.survival_method = (c.survival_method || "") + " Phát triển hệ hô hấp phổi nhánh mang (branchiostegal lungs) chứa mô mạch máu dày đặc giúp thở không khí trực tiếp thay thế hoàn toàn cho mang dưới nước.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu hệ khứu giác anten đặc biệt có cơ chế cấu trúc thần kinh và thụ thể phân tử tiến hóa hội tụ cực kỳ tương đồng với côn trùng trên cạn.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1371/journal.pone.0166108",
        "label": "PLOS ONE - Strike Force of the Coconut Crab"
      },
      {
        "url": "https://doi.org/10.1016/j.cub.2005.09.008",
        "label": "Current Biology - Insect-like Olfactory System in Birgus latro"
      }
    ];

  } else if (c.id === 'coelacanth') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá tầng đáy", "mực ống", "bạch tuộc", "cá mập nhỏ", "cá đuối"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 60;
    newC.lifespan_max = 100;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Đẻ con (noãn thai sinh). Trứng khổng lồ tự phát triển trong tử cung nhờ nguồn noãn hoàng. Thời gian mang thai kéo dài kỷ lục từ 3 đến 5 năm, đẻ ra 5-25 con non khỏe mạnh hoàn chỉnh.';
    newC.locomotion = 'swim';
    newC.speed_max = 5.0;
    newC.conservation_status = 'CR';
    newC.size_min_mm = 1500.0;
    newC.size_max_mm = 2000.0;
    newC.weight_avg_g = 80000.0;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc xương sụn linh hoạt kết hợp với dây sống chứa đầy dầu (notochord) đóng vai trò nâng đỡ cơ thể thay cho xương sống cứng.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng các vây thùy thịt di chuyển chéo khớp nhịp nhàng mô phỏng động vật bốn chân giúp giữ thăng bằng tuyệt vời khi trôi nổi lơ lửng dọc dòng hải lưu.";
    newC.unique_traits = (c.unique_traits || "") + " Có cơ quan rostral ở trán chứa chất keo dẫn điện cực nhạy giúp cảm nhận các xung điện trường nhỏ từ con mồi trong bóng tối biển sâu.";
    
    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.nature.com/articles/nature12027",
        "label": "Nature - The coelacanth genome and thoracic evolution"
      },
      {
        "url": "https://www.iucnredlist.org/species/11389/3277567",
        "label": "IUCN Red List - Latimeria chalumnae"
      }
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
