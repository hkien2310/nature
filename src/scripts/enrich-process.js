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

  if (c.id === 'wood-frog') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["côn trùng", "nhện", "giun đất", "ốc sên", "nòng nọc (ấu trùng)"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 3;
    newC.lifespan_max = 5;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản vào đầu mùa xuân ngay sau khi tan băng. Con cái đẻ hàng nghìn quả trứng thành các khối lớn bám vào thực vật thủy sinh trong các vũng nước tạm thời không có cá (vernal pools). Nòng nọc nở sau 10-30 ngày và biến thái thành ếch con trong vòng 2-3 tháng.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 5.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 35.0;
    newC.size_max_mm = 89.0;
    newC.weight_avg_g = 15.0;

    newC.characteristics = (c.characteristics || "") + " Tuyến da tiết chất nhầy giàu peptide kháng khuẩn mạnh giúp bảo vệ cơ thể khỏi nấm trong thời kỳ đông cứng.";
    newC.survival_method = (c.survival_method || "") + " Tái chế urê tích tụ trong các mô cơ để đóng vai trò làm chất chống đông tự nhiên kết hợp với glucose từ gan.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng chịu đông cứng sinh học hoàn chỉnh lên tới 70% lượng nước trong cơ thể biến thành tinh thể băng mà không gây tổn thương mô tế bào.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1242/jeb.00626",
        "label": "Journal of Experimental Biology - Urea accumulation and freeze tolerance in wood frogs"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Trong thời kỳ ngủ đông, bộ não của ếch gỗ hoàn toàn không có hoạt động điện não đo được nhưng tế bào thần kinh vẫn được bảo toàn nguyên vẹn.",
      "Chúng có thể chịu đựng được tình trạng đông cứng và rã đông liên tục nhiều lần trong một mùa đông mà không gặp biến chứng nào."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng tái hấp thu nước tiểu tích tụ trong mô cơ để chuyển hóa thành urê bảo vệ đông tế bào vượt trội."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Ếch con biến thái chịu hạn kém và dễ mất nước nhanh chóng trong môi trường khô cằn mùa hè."
    ];

  } else if (c.id === 'woodpecker') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["ấu trùng côn trùng", "bọ cánh cứng", "kiến", "hạt thông", "quả hạch", "nhựa cây"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 5;
    newC.lifespan_max = 11;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản từ tháng 4 đến tháng 6. Cả chim bố và mẹ cùng đục một hốc tổ sâu trên thân cây gỗ mục. Chim cái đẻ từ 4-7 quả trứng màu trắng. Trứng được cả bố và mẹ thay phiên nhau ấp trong khoảng 10-12 ngày. Chim non được nuôi dưỡng bằng côn trùng trong tổ khoảng 20-23 ngày trước khi tập bay.';
    newC.locomotion = 'fly';
    newC.speed_max = 40.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 200.0;
    newC.size_max_mm = 240.0;
    newC.weight_avg_g = 85.0;

    newC.characteristics = (c.characteristics || "") + " Bộ lông đuôi nhọn và cực kỳ cứng chịu lực nén cơ học cao khi tựa vào vỏ cây dốc đứng làm điểm đỡ lực khoan.";
    newC.survival_method = (c.survival_method || "") + " Sử dụng kỹ thuật đè (anvil technique) để găm quả thông hoặc hạt dẻ vào kẽ cây rồi dùng mỏ đập vỡ vỏ lấy nhân.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu màng xương sọ xốp dạng bọt khí có khả năng hấp thụ chấn động cơ học giảm chấn cực hạn bảo vệ hệ thần kinh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1098/rsif.2013.1066",
        "label": "Journal of The Royal Society Interface - Mechanical properties of woodpecker skull bones"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mỏ chim gõ kiến không đập vuông góc trực tiếp vào thớ gỗ mà luôn chệch một góc nhỏ vài độ để phân tán lực phản hồi dọc theo đường cơ xương lưỡi.",
      "Chúng là kỹ sư sinh thái quan trọng khi các hốc tổ bỏ hoang của chúng trở thành nhà cho hàng chục loài chim và dơi nhỏ khác."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ chế bàn chân Zygodactyl bám cây cực chắc chắn trên vỏ cây dựng đứng tạo thế kiềng ba chân ổn định."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Hành vi gõ đập tạo ra tiếng ồn rất lớn làm tăng nguy cơ bị phát hiện bởi các loài chim săn mồi ban ngày."
    ];

  } else if (c.id === 'african-bullfrog') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["chuột", "côn trùng", "ếch khác", "bò sát nhỏ", "chim nhỏ", "rắn độc nhỏ"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 20;
    newC.lifespan_max = 40;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản xảy ra sau những cơn mưa lớn đầu mùa mưa. Con đực đầu đàn kiểm soát các vùng nước nông và giao phối với nhiều con cái. Con cái đẻ từ 3.000 đến 4.000 quả trứng. Trứng nở cực nhanh trong 36 giờ. Ếch bố ở lại bảo vệ nòng nọc rất hung dữ và đào kênh dẫn nước để cứu đàn con nếu hồ bị cạn.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 10.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 120.0;
    newC.size_max_mm = 245.0;
    newC.weight_avg_g = 1000.0;

    newC.characteristics = (c.characteristics || "") + " Da dày có cấu trúc tuyến tiết chất nhầy đặc biệt có thể khô lại hóa sừng tạo kén bảo vệ cơ thể.";
    newC.survival_method = (c.survival_method || "") + " Tích tụ ure nồng độ cao trong các mô cơ giúp duy trì áp suất thẩm thấu khi ngủ hè sâu dưới lòng đất khô.";
    newC.unique_traits = (c.unique_traits || "") + " Hàm dưới tiến hóa các mấu xương nhọn odontoids hoạt động giống răng thật mang lại lực cắn giữ và xé thịt cực mạnh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.cbpa.2007.12.008",
        "label": "Comparative Biochemistry and Physiology - Water economy of aestivating Pyxicephalus adspersus"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Trong thời gian ngủ hè dưới đất, da của ếch bò châu Phi tích tụ nhiều lớp da chết xếp tầng giảm tỷ lệ thoát hơi nước xuống gần bằng 0.",
      "Lực cắn của ếch bò châu Phi trưởng thành có thể tạo ra lực ép hơn 30 Newton dễ dàng làm dập nát xương sọ con mồi."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Mấu sừng sắc cứng ở gót chân sau hỗ trợ đào đất cực nhanh tạo hang trú ẩn sâu tránh nhiệt lượng."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Nhịp tim và hô hấp cực thấp khi ngủ hè khiến chúng phản ứng thụ động và dễ bị tổn thương nếu hang bị đào bới."
    ];

  } else if (c.id === 'african-bush-elephant') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["cỏ", "lá cây", "vỏ cây", "rễ cây", "trái cây"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 60;
    newC.lifespan_max = 70;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Thời gian mang thai dài nhất trong tất cả các động vật có vú trên cạn, khoảng 22 tháng. Con cái thường sinh một con non duy nhất (hiếm khi sinh đôi). Voi non có thể đứng và đi lại chỉ sau vài giờ sau khi sinh. Cả đàn (đặc biệt là các con voi cái) cùng chăm sóc voi non.';
    newC.locomotion = 'walk';
    newC.speed_max = 40.0;
    newC.conservation_status = 'EN';
    newC.size_min_mm = 3000.0;
    newC.size_max_mm = 4000.0;
    newC.weight_avg_g = 6000000.0;

    newC.characteristics = (c.characteristics || "") + " Da nhăn nheo có khả năng giữ bùn đất và nước lâu gấp 5-10 lần bình thường giúp điều hòa nhiệt lượng và chống ký sinh trùng.";
    newC.survival_method = (c.survival_method || "") + " Tổ chức xã hội mẫu hệ chặt chẽ truyền đạt tri thức sinh tồn định vị nguồn nước ngầm qua các thời kỳ hạn hán lịch sử.";
    newC.unique_traits = (c.unique_traits || "") + " Hệ thống thụ cảm nhạy cảm ở lòng bàn chân có thể cảm nhận các rung động chấn địa hạ âm tần số dưới 20Hz lan truyền xa tới 10 km.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/jzo.12480",
        "label": "Journal of Zoology - Reproductive endocrinology of wild African elephants"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Voi rừng châu Phi cái có khả năng trì hoãn chu kỳ rụng trứng tạm thời khi điều kiện khí hậu savan quá khắc nghiệt.",
      "Chúng có thể phân biệt giọng nói của các nhóm người khác nhau để đánh giá mức độ đe dọa của thợ săn đối với đàn."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Chiếc vòi voi chứa hơn 40.000 bó cơ hoạt động cực kỳ linh hoạt vừa tạo lực nâng tới 300kg vừa thao tác nhặt được hạt cỏ nhỏ."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Tỷ lệ tiêu hóa xơ thấp (khoảng 40%) buộc chúng phải dành tới 16-18 tiếng mỗi ngày để ăn nạp năng lượng."
    ];

  } else if (c.id === 'african-crested-rat') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["lá cây", "rễ cây", "vỏ cây (đặc biệt là Acokanthera schimperi)", "trái cây"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 3;
    newC.lifespan_max = 8;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, đẻ con (thường từ 1-3 con non mỗi lứa). Con non sinh ra đã có lông phát triển và nhanh chóng học tập hành vi nhai cây độc Acokanthera bôi lên lông sườn từ chuột mẹ để tự tự vệ.';
    newC.locomotion = 'walk';
    newC.speed_max = 15.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 250.0;
    newC.size_max_mm = 360.0;
    newC.weight_avg_g = 750.0;

    newC.characteristics = (c.characteristics || "") + " Tuyến lông sườn xốp rỗng đặc trưng có liên kết hóa học bền vững hấp thụ và lưu trữ lâu dài độc tố ouabain.";
    newC.survival_method = (c.survival_method || "") + " Nhai vỏ cây Acokanthera chứa glycoside trợ tim cực độc bôi lên lớp lông sườn xốp xù để đầu độc kẻ thù ngoạm phải.";
    newC.unique_traits = (c.unique_traits || "") + " Kháng độc tố ouabain tự nhiên vượt trội gấp 1000 lần loài gặm nhấm khác nhờ thụ thể tim mạch Na+/K+-ATPase biến đổi đặc hiệu.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/jzo.12001",
        "label": "Journal of Zoology - Morphology of the specialized skin and hair of Lophiomys imhausi"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù có độc hại và gai góc, chuột mào châu Phi lại sống một vợ một chồng rất chung thủy và phát ra tiếng kêu rù rù êm ái khi giao tiếp giống mèo.",
      "Lớp da ở sườn dưới tuyến lông độc dính sát và dày hơn da lưng bình thường để chịu chấn thương đòn cắn từ kẻ săn mồi."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ chế cấu trúc lông bọc xốp ngăn không cho chất độc ouabain tẩm bên ngoài thấm ngược vào cơ thể chuột."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Phụ thuộc sinh cảnh tuyệt đối vào sự hiện diện của loài cây chứa độc chất Acokanthera để bổ sung vũ khí hóa học tự vệ."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
