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

  if (c.id === 'spitting-cobra') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["chuột nhắt", "chuột cống", "ếch", "nhái", "thằn lằn", "rắn nhỏ khác", "trứng chim"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 10;
    newC.lifespan_max = 20;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng. Mỗi lứa đẻ từ 10 đến 24 quả trứng vào cuối mùa hè, thời gian ấp kéo dài khoảng 90-100 ngày. Rắn non mới nở dài khoảng 20-25 cm và đã có sẵn nọc độc hoàn chỉnh để tự vệ.';
    newC.locomotion = 'crawl';
    newC.speed_max = 15.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 1200.0;
    newC.size_max_mm = 2200.0;
    newC.weight_avg_g = 1500.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống cơ nanh bọc xung quanh tuyến độc được phối hợp đồng bộ với cơ vòng co bóp cực nhanh, cho phép nén và phun nọc chỉ trong vòng chưa đầy 200 mili giây khi bị kích thích.";
    newC.survival_method = (c.survival_method || "") + " Ngoài khả năng phun nọc độc tự vệ từ xa, chúng còn sở hữu kỹ năng giả chết (thanatosis) cực kỳ thuyết phục khi bị dồn vào đường cùng và không thể trốn thoát.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng phun nọc chéo góc tạo thành hình nón sương dung dịch bao phủ toàn bộ vùng mặt của kẻ tấn công, đảm bảo nọc độc luôn dính vào niêm mạc mắt dù đối phương có dịch chuyển đầu.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1242/jeb.082081",
        "label": "Journal of Experimental Biology - Venom spitting in cobras: mechanics and evolution"
      },
      {
        "url": "https://doi.org/10.1093/iob/obab012",
        "label": "Integrative Organismal Biology - Functional morphology of spitting cobra fangs"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Nọc độc phun ra có thể giữ nguyên độc tính trong nhiều ngày nếu bám trên các bề mặt khô ráo ở môi trường xung quanh.",
      "Loài rắn này có thể phun nọc chính xác ngay cả khi đang bị treo ngược hoặc ở các tư thế vô cùng khó khăn."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng thích ứng sinh thái cực cao giúp chúng sinh sống tốt ở cả vùng xavan khô hạn lẫn khu rừng thứ sinh ẩm ướt.",
      "Nọc độc chứa hỗn hợp phospholipase A2 và cytotoxin hoạt động hiệp đồng tạo phản ứng kích ứng cực độ tức thì."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Tầm nhìn bị hạn chế đáng kể ngay trước khi lột da làm giảm hiệu quả nhắm bắn nọc độc.",
      "Tiêu tốn lượng lớn năng lượng và protein để tái tổng hợp nọc độc nếu cạn kiệt sau các chuỗi phun tự vệ liên tục."
    ];

  } else if (c.id === 'spotted-hyena') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["linh dương đầu bò", "ngựa vằn", "linh dương Thompson", "trâu rừng", "xác thối"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 12;
    newC.lifespan_max = 20;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh con. Thời gian mang thai khoảng 110 ngày. Con cái sinh từ 1-2 con non trong hang. Sữa linh cẩu có lượng protein (14.9%) và béo (12.5%) cao vượt trội để nuôi con non phát triển nhanh.';
    newC.locomotion = 'walk';
    newC.speed_max = 60.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 950.0;
    newC.size_max_mm = 1800.0;
    newC.weight_avg_g = 62000.0;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc xương chi trước cao hơn chi sau kết hợp với các dây chằng đàn hồi cao giúp linh cẩu tích lũy và giải phóng động năng hiệu quả, tối ưu hóa sức bền hiếu khí khi di chuyển đường dài.";
    newC.survival_method = (c.survival_method || "") + " Hệ thống phân cấp xã hội nghiêm ngặt được củng cố bằng các tín hiệu hóa học từ tuyến mùi hương hậu môn (sebum), giúp định danh cá nhân và duy trì trật tự bầy đàn mà không cần xung đột bạo lực.";
    newC.unique_traits = (c.unique_traits || "") + " Hàm lượng nội tiết tố androgen và testosterone cực cao ở con cái mang thai làm biến đổi cấu trúc giải phẫu ngoài, tăng kích thước cơ thể và độ hung dữ của cả mẹ lẫn con non sơ sinh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1007/s00265-019-2781-4",
        "label": "Behavioral Ecology and Sociobiology - Clan cooperation and hunting decisions in spotted hyenas"
      },
      {
        "url": "https://doi.org/10.1016/j.ygcen.2017.06.012",
        "label": "General and Comparative Endocrinology - Hormonal profiles of female spotted hyenas"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Linh cẩu đốm cái có quyền ưu tiên ăn trước tiên tại xác con mồi, trong khi các con đực chỉ được ăn những phần còn lại.",
      "Các con linh cẩu đốm trong cùng một đàn có thể nhận diện tiếng cười của nhau để xác định danh tính và tâm trạng của đồng bạn."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng phục hồi thể lực siêu tốc nhờ hệ tuần hoàn có kích thước tim và thể tích phổi cực lớn.",
      "Cấu trúc răng tiền hàm thứ ba (P3) chuyên biệt hoạt động như chiếc kìm cộng lực cắt nghiền các mấu xương lớn dễ dàng."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Con non đực gặp áp lực sinh tồn cực lớn khi phải rời đàn cũ ở tuổi trưởng thành để tìm cách gia nhập đàn mới.",
      "Hệ cơ cổ và hàm quá phát triển làm giảm độ linh hoạt xoay trở đầu và cổ khi đối đầu với các đòn cắn nhanh của họ mèo."
    ];

  } else if (c.id === 'star-nosed-mole') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["giun đất", "côn trùng thủy sinh", "ốc sên", "nhuyễn thể", "cá nhỏ", "nòng nọc"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 3;
    newC.lifespan_max = 4;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh con. Mang thai khoảng 45 ngày, đẻ mỗi lứa từ 2-7 con non vào cuối xuân. Con non tự lập hoàn toàn sau 30 ngày.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 8.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 150.0;
    newC.size_max_mm = 200.0;
    newC.weight_avg_g = 55.0;

    newC.characteristics = (c.characteristics || "") + " Hệ cơ bả vai và xương đòn của chuột chũi phát triển cực đại, tạo thành điểm bám chắc chắn cho cơ ngực lớn, giúp thực hiện các cú đào bới đất liên tục với lực cơ học tương đương 20 lần trọng lượng cơ thể.";
    newC.survival_method = (c.survival_method || "") + " Khả năng định vị con mồi trong môi trường bùn tối tăm thông qua việc phát hiện rung động âm học tần số thấp và thay đổi vi áp suất bằng các cơ quan cảm giác Eimer ở mũi.";
    newC.unique_traits = (c.unique_traits || "") + " Sự hiện diện của các sợi thần kinh sợi Myelin siêu dày kết nối mũi sao trực tiếp tới vỏ não cảm giác, giảm thiểu độ trễ dẫn truyền tín hiệu xuống mức tối thiểu khoảng 1.5 mili giây.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1002/ar.24589",
        "label": "The Anatomical Record - Specialized skeletal design for digging in Talpid moles"
      },
      {
        "url": "https://doi.org/10.1152/jn.00908.2012",
        "label": "Journal of Neurophysiology - Neural response properties of Eimer's organ"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chúng có thể ăn trọn một con giun đất nhỏ chỉ trong 120 mili giây, nhanh hơn thời gian một cái chớp mắt của con người tới 3 lần.",
      "Chuột chũi mũi sao sở hữu cấu trúc hemoglobin đặc biệt có khả năng liên kết oxy cao giúp chúng thở tốt dưới môi trường thiếu khí sâu trong lòng đất."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng định vị không gian 3D hoàn hảo trong lòng đất tối tăm nhờ ma trận thụ cảm xúc giác ở mũi.",
      "Đôi chân trước to bè hoạt động như những xẻng xúc đất tự nhiên giúp di chuyển nhanh qua các địa hình đất sét chặt."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Chiếc mũi sao bằng thịt nhạy cảm dễ bị tổn thương nghiêm trọng nếu va chạm với đá sắc nhọn hoặc đất khô cằn.",
      "Tốc độ mất nước qua niêm mạc mũi sao rất nhanh, khiến chúng bắt buộc phải ở gần nguồn nước ẩm."
    ];

  } else if (c.id === 'stargazer-fish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "cua", "tôm", "giáp xác", "giun biển"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 4;
    newC.lifespan_max = 6;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng. Đẻ trứng trôi nổi ở tầng nước mở vào mùa xuân và mùa hè (tháng 4 đến tháng 9). Trứng và ấu trùng trôi nổi tự do trước khi chìm xuống đáy biến thái thành cá con.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 5.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 200.0;
    newC.size_max_mm = 350.0;
    newC.weight_avg_g = 1200.0;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc hộp sọ dẹt cứng hóa vôi cao cùng hệ cơ nắp mang phát triển giúp chịu được áp lực đất cát chôn vùi mà không ảnh hưởng tới hoạt động tuần hoàn nước hô hấp.";
    newC.survival_method = (c.survival_method || "") + " Phóng dòng điện sinh học 50V từ cơ quan phát điện myogenic nằm sau hốc mắt để làm choáng hoặc xua đuổi các loài cá săn mồi lớn muốn tấn công chúng dưới cát.";
    newC.unique_traits = (c.unique_traits || "") + " Sự biến đổi của cơ vận nhãn (cơ mắt) thành các phiến điện sinh học (electroplaques) có khả năng giải phóng ion tích tụ để tạo dòng điện xung xung quanh vùng đầu.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1007/s00359-020-01452-1",
        "label": "Journal of Comparative Physiology A - Electrogenesis and sensory integration in stargazers"
      },
      {
        "url": "https://doi.org/10.1111/jfb.13904",
        "label": "Journal of Fish Biology - Morphology of venom apparatus in Uranoscopidae"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Cá thần chết có thể thụt cặp mắt vào sâu bên trong hốc mắt để tránh cát lọt vào khi chúng chôn mình quá sâu.",
      "Dải thịt mồi nhử trong miệng chúng chuyển động uốn lượn hoàn hảo bắt chước chuyển động của loài giun biển cát."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Sở hữu cơ quan phát điện sinh học tự vệ độc đáo nằm ngay sau hốc mắt.",
      "Hai gai độc lớn sau nắp mang có khả năng tiêm truyền nọc độc mạnh gây hoại tử mô nhanh chóng."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Không có khả năng bơi lội linh hoạt ở tầng nước giữa hoặc săn đuổi con mồi chủ động.",
      "Cơ quan phát điện tiêu tốn nhiều năng lượng tích lũy và cần thời gian phục hồi điện thế sau mỗi chu kỳ phóng điện."
    ];

  } else if (c.id === 'stonefish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "tôm biển", "cua biển", "giáp xác khác"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 5;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ hàng triệu quả trứng nhỏ bám dính trên các rạn đá ngầm, sau đó con đực sẽ phun tinh trùng để thụ tinh ngoài. Trứng nở thành ấu trùng trong vòng vài ngày.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 3.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 300.0;
    newC.size_max_mm = 400.0;
    newC.weight_avg_g = 1950.0;

    newC.characteristics = (c.characteristics || "") + " Lớp da không vảy bọc ngoài được phủ bởi một lớp sần sùi chứa nhiều tuyến nhầy đặc biệt tiết ra chất dịch giàu glycoprotein bám dính bùn đất và tảo biển để tối ưu ngụy trang.";
    newC.survival_method = (c.survival_method || "") + " Khi có lực đè nặng lên các gai lưng, bao cơ quanh gai sẽ bị nén mạnh, đẩy nọc độc từ hai tuyến độc nằm ở gốc gai phun ngược lên theo rãnh dẫn đi thẳng vào cơ thể đối phương.";
    newC.unique_traits = (c.unique_traits || "") + " Độc tố Stonustoxin (SNTX) là một protein lưỡng phân (dimeric protein) có khả năng tạo lỗ thủng trên màng tế bào gây tan máu cực mạnh và ức chế co bóp cơ tim trực tiếp.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.toxicon.2021.04.019",
        "label": "Toxicon - Pharmacological activities of Synanceia verrucosa venom components"
      },
      {
        "url": "https://doi.org/10.3390/md19030154",
        "label": "Marine Drugs - Bioactive proteins from stonefish venom glands"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Lớp tảo bám trên da cá đá không chỉ ngụy trang mà còn cung cấp oxy bổ sung thông qua quá trình quang hợp trong điều kiện nước tù.",
      "Khi bị phơi mình trên cạn lúc thủy triều rút, chúng có thể hạ thấp nhịp tim xuống mức tối thiểu để tiết kiệm năng lượng."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Độc tố tan máu stonustoxin cực mạnh gây liệt tuần hoàn nhanh chóng ở mục tiêu.",
      "Khả năng chịu đựng áp lực cơ học và sống sót trong điều kiện thiếu nước cực đỉnh."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Nếu lớp dịch nhầy ngụy trang bị rửa trôi sạch, chúng sẽ dễ dàng bị phát hiện và tấn công bởi các thiên địch lớn.",
      "Hệ thống tự vệ thụ động bằng gai lưng không thể chủ động tấn công hoặc săn đuổi kẻ thù từ xa."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
