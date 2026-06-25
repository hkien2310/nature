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

console.log(`Processing enrichment for ${targets.length} targets...`);

const enriched = targets.map(c => {
  const newC = { ...c };
  newC.enrichment_count = (c.enrichment_count || 0) + 1;

  if (c.id === 'southern-cassowary') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["quả chín", "hạt", "côn trùng", "động vật lưỡng cư nhỏ", "động vật gặm nhấm nhỏ", "nấm"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 30;
    newC.lifespan_max = 50;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng. Con đực ấp trứng từ 3-8 quả màu xanh ngọc bích trong khoảng 50 ngày và chăm sóc chim non đơn độc trong 9 tháng, trong khi con cái rời đi tìm bạn tình khác.';
    newC.locomotion = 'walk';
    newC.speed_max = 50.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 1500.0;
    newC.size_max_mm = 1800.0;
    newC.weight_avg_g = 60000.0;

    newC.characteristics = (c.characteristics || "") + " Hệ cơ chân của đà điểu đầu mũi có cấu trúc bó cơ đùi cực kỳ phát triển, phân bổ trọng tâm cơ thể hoàn hảo giúp thực hiện cú nhảy vọt cao tới 1.5 - 2m từ thế đứng yên.";
    newC.survival_method = (c.survival_method || "") + " Khả năng tiêu hóa hạt độc của quả cây Cycad nhờ cấu trúc ruột ngắn đặc biệt giúp thức ăn di chuyển nhanh và màng ruột tiết chất nhầy chống hấp thụ độc tố.";
    newC.unique_traits = (c.unique_traits || "") + " Lớp sừng của casque (mũ sừng) hoạt động như một bộ giảm chấn thủy lực tự nhiên bảo vệ sọ khỏi va đập trực tiếp khi húc đầu qua các bụi cây mây gai góc.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/j.1469-7998.2005.00010.x",
        "label": "Journal of Zoology - Biomechanics of Cassowary Casque"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chúng có khả năng bơi vượt biển tuyệt vời, thường xuyên di chuyển giữa các đảo nhỏ ở Queensland để tìm kiếm nguồn thức ăn mới."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cú đá trực diện giải phóng động năng cực lớn kết hợp móng vuốt ngón trong có thể gây ra lực đâm xuyên phá vỡ lớp giáp bảo vệ của đối phương."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Thiếu khả năng bay lượn hoàn toàn làm giảm đáng kể khả năng đào thoát khi bị bao vây bởi đám đông kẻ đi săn hung hãn."
    ];

  } else if (c.id === 'spanish-ribbed-newt') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["côn trùng nước", "giun đất", "nòng nọc", "giáp xác nhỏ", "ốc sên nhỏ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 10;
    newC.lifespan_max = 20;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Thụ tinh trong. Con đực ôm giữ con cái dưới nước, con cái đẻ từ 100 đến 1000 quả trứng nhỏ bám thành chuỗi vào lá cây thủy sinh.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 2.0;
    newC.conservation_status = 'NT';
    newC.size_min_mm = 150.0;
    newC.size_max_mm = 300.0;
    newC.weight_avg_g = 80.0;

    newC.characteristics = (c.characteristics || "") + " Hệ cơ sườn cho phép xoay xương sườn lên tới góc 50 độ để sẵn sàng đâm thủng lớp da hai bên hông làm gai nhọn.";
    newC.survival_method = (c.survival_method || "") + " Tiết độc tố kháng khuẩn cực mạnh phủ quanh các gai xương sườn nhô ra, vừa gây kích ứng mạnh màng nhầy của kẻ thù vừa ngăn ngừa nhiễm trùng cho vết thương của chính nó.";
    newC.unique_traits = (c.unique_traits || "") + " Tế bào biểu mô tiết ra protein collagen thế hệ mới cùng các cytokine đặc hiệu kích hoạt chu trình phân chia và tái tạo mô xương gãy nhanh hơn 5 lần so với động vật thông thường.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1073/pnas.1712529115",
        "label": "PNAS - Genome of the Iberian Ribbed Newt and Tissue Regeneration"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chúng có thể tự phục hồi hoàn hảo thủy tinh thể của mắt bị tổn thương nhiều lần mà không để lại sẹo hay làm suy giảm thị lực âm học."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ chế gai xương tự vệ tẩm độc gây phản ứng xua đuổi tức thời đối với các loài săn mồi thủy sinh lớn như cá vược hay chim nước."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Tốc độ di chuyển bò trên cạn vô cùng chậm chạp và vụng về làm mất ưu thế chủ động phòng vệ."
    ];

  } else if (c.id === 'sperm-whale') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["mực khổng lồ", "mực siêu khổng lồ", "cá tuyết sâu", "cá đuối sâu", "bạch tuộc đáy biển"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 60;
    newC.lifespan_max = 70;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh con và nuôi con bằng sữa mẹ. Thời gian mang thai kéo dài 14-16 tháng, sinh duy nhất 1 con non sau mỗi 3-6 năm. Sữa mẹ chứa hàm lượng béo cao tới 36%.';
    newC.locomotion = 'swim';
    newC.speed_max = 37.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 11000.0;
    newC.size_max_mm = 16000.0;
    newC.weight_avg_g = 30000000.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống cơ quan tinh dịch spermaceti chứa sáp sinh học có khả năng thay đổi trạng thái từ lỏng sang đặc nhanh chóng bằng cách điều tiết nhiệt độ dòng máu đi qua, kiểm soát tối ưu lực nổi.";
    newC.survival_method = (c.survival_method || "") + " Hệ hô hấp có chứa lượng huyết sắc tố myoglobin cực đại trong các thớ cơ xương, cho phép tích trữ lượng oxy khổng lồ để duy trì hoạt động hô hấp tế bào ở độ sâu 3000m.";
    newC.unique_traits = (c.unique_traits || "") + " Sóng siêu âm định vị bằng tiếng click hội tụ qua thấu kính dầu spermaceti tạo ra xung áp lực âm học lên tới 230 dB, định hướng chính xác hình ảnh con mồi trong bóng tối tuyệt đối.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1242/jeb.00608",
        "label": "Journal of Experimental Biology - Diving Physiology of Sperm Whales"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Để ngủ nghỉ dưới đại dương, chúng treo mình thẳng đứng lơ lửng như những cột đá khổng lồ chỉ trong 10-15 phút mỗi lần."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Lớp mỡ dưới da dày tới 35 cm hoạt động như một lớp đệm hấp thụ lực va đập và giữ nhiệt tuyệt đối trong làn nước cận 0 độ C ở đáy biển sâu."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Có xu hướng bị tổn thương xương tích lũy (hoại tử xương) nếu nổi lên mặt nước quá nhanh do thay đổi áp suất đột ngột."
    ];

  } else if (c.id === 'spider-tailed-horned-viper') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["chim sẻ di cư", "chim oanh", "thằn lằn cát", "chuột sa mạc", "côn trùng lớn"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 8;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ từ 10 đến 20 quả trứng trong các khe đá ẩm sâu bên trong dãy núi Zagros để tránh nhiệt độ thiêu đốt ban ngày.';
    newC.locomotion = 'crawl';
    newC.speed_max = 5.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 400.0;
    newC.size_max_mm = 700.0;
    newC.weight_avg_g = 400.0;

    newC.characteristics = (c.characteristics || "") + " Hệ cơ đuôi chuyên biệt gồm các bó cơ nâng và cơ xoay bên hoạt động độc lập với thân rắn, cho phép vẫy đuôi liên tục nhiều giờ mô phỏng chuyển động nhện bò.";
    newC.survival_method = (c.survival_method || "") + " Sự tiến hóa hội tụ tạo nên lớp vảy gai bọc xung quanh mô mỡ phình ở đuôi giống hệt các đốt chân nhện thực sự, kết hợp chuyển động giật cục tạo ảo giác nhện bò tự nhiên.";
    newC.unique_traits = (c.unique_traits || "") + " Nọc độc hemotoxin đậm đặc chứa hàm lượng enzyme metalloproteinase siêu cao gây phá hủy mạch máu và hoại tử cục bộ tức thời tại vết cắn, làm tê liệt chim nhanh chóng.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.2988/0097-8000(2006)119[266:ANSOPU]2.0.CO;2",
        "label": "BioOne - Original Description of Pseudocerastes urachnoides"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chúng có thể nhận biết hướng gió sa mạc thổi để điều chỉnh tư thế vẫy đuôi xuôi theo gió, khiến con mồi giả nhện trông tự nhiên nhất có thể."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng ngụy trang vật lý tàng hình tiệp màu hoàn hảo với các khe nứt đá vôi xám khô cằn của dãy núi Zagros."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Hiệu suất săn mồi giảm mạnh tới 80% nếu chiếc đuôi giả nhện bị tổn thương nghiêm trọng hoặc đứt lìa."
    ];

  } else if (c.id === 'spiny-bush-viper') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["ếch cây", "thằn lằn bóng", "chuột nhắt rừng", "chim nhỏ", "côn trùng lớn"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 10;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Đẻ con (ovoviviparous). Trứng được ấp và nở ngay bên trong cơ thể mẹ. Con cái sinh từ 5-12 con non tự lập hoàn chỉnh vào đầu mùa mưa.';
    newC.locomotion = 'crawl';
    newC.speed_max = 4.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 550.0;
    newC.size_max_mm = 750.0;
    newC.weight_avg_g = 150.0;

    newC.characteristics = (c.characteristics || "") + " Bộ vảy keeled gồ ghề nhô ra ngoài được bao phủ bởi các gờ nổi cứng làm tăng diện tích bề mặt tiếp xúc, giảm ma sát tối đa khi trườn qua thảm thực vật gai góc ẩm ướt.";
    newC.survival_method = (c.survival_method || "") + " Cơ chế cảm biến hồng ngoại thông qua thụ thể nhạy nhiệt nằm giữa mắt và mũi cho phép vẽ bản đồ nhiệt độ con mồi chính xác đến mức 0.003 độ C trong đêm rậm.";
    newC.unique_traits = (c.unique_traits || "") + " Độc tố metalloproteinase gây xuất huyết tế bào và hoại tử mô kết hợp với độc tố thần kinh làm tê liệt cục bộ con mồi mà hiện tại chưa có huyết thanh kháng nọc thương mại.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.toxicon.2018.06.012",
        "label": "Toxicon - Proteomic characterization of Atheris hispida venom"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Những chiếc vảy dựng ngược của rắn lục vảy sừng không chỉ để ngụy trang mà còn hoạt động như rãnh dẫn nước mưa chảy tuột đi nhanh chóng."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Đuôi cầm nắm chuyên biệt vô cùng khỏe giúp rắn treo mình săn mồi từ cành cây cao và rình đớp chim bay qua."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Khả năng tiêu hóa thức ăn giảm sút rõ rệt khi nhiệt độ môi trường giảm xuống dưới 20 độ C do là động vật biến nhiệt."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
