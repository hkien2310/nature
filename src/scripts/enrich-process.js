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

  if (c.id === 'pistol-shrimp') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "cua nhỏ", "giun biển", "giáp xác nhỏ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 3;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính. Tôm súng thường sống theo cặp một vợ một chồng suốt đời. Con cái đẻ hàng trăm trứng và mang chúng dưới bụng cho đến khi nở thành ấu trùng bơi tự do.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 1.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 30.0;
    newC.size_max_mm = 50.0;
    newC.weight_avg_g = 25.0;

    newC.characteristics = (c.characteristics || "") + " Càng lớn của tôm súng có một pittông khớp ăn khớp hoàn hảo với một ổ lõm, khi kẹp lại sẽ ép một tia nước bắn ra ở vận tốc lên tới 30 m/s.";
    newC.survival_method = (c.survival_method || "") + " Khớp càng lớn có hệ cơ bắp đối nghịch cực mạnh, một cơ khép khổng lồ để tích năng lượng và cơ mở để giữ chốt cơ học.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng tạo ra hiện tượng phát quang do âm thanh (sonoluminescence) cực kỳ hiếm gặp ở động vật, giải phóng photon ánh sáng khi bong bóng sụp đổ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1121/1.428616",
        "label": "Journal of the Acoustical Society of America - Underwater sound of snapping shrimp"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Tiếng nổ kẹp càng của tôm súng có thể át cả tiếng ồn xung quanh của đại dương, đóng vai trò như một tấm khiên âm thanh che mắt các thiết bị định vị dưới nước."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ chế giải phóng năng lượng đàn hồi của protein resilin ở khớp càng giúp tạo ra gia tốc đòn đánh cực đại không phụ thuộc vào tốc độ co cơ thông thường."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Quá trình thay càng súng khi bị đứt đòi hỏi năng lượng rất lớn và đảo ngược vị trí càng súng (càng súng chuyển sang càng nhỏ cũ), khiến chúng dễ bị tổn thương trong quá trình chuyển đổi sinh học."
    ];

  } else if (c.id === 'planarian-flatworm') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["giun nước", "giáp xác nhỏ", "ấu trùng côn trùng", "ốc sên nhỏ", "xác hữu cơ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 3;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'hermaphrodite';
    newC.reproduction_notes = 'Sinh sản lưỡng tính chéo nhau ở dòng hữu tính bằng cách đẻ kén trứng chứa nhiều phôi. Ở dòng vô tính, chúng tự phân tách (fission) ở giữa thân rồi mỗi nửa tự tái tạo phần còn thiếu.';
    newC.locomotion = 'crawl';
    newC.speed_max = 0.05;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 10.0;
    newC.size_max_mm = 20.0;
    newC.weight_avg_g = 0.03;

    newC.characteristics = (c.characteristics || "") + " Hệ thống biểu bì có các lông rung (cilia) nhỏ li ti phủ dưới bụng phối hợp co bóp nhịp nhàng để lướt êm ái trên lớp chất nhầy tự tiết.";
    newC.survival_method = (c.survival_method || "") + " Tiết ra lớp chất nhầy bảo vệ có chứa các hợp chất hóa học xua đuổi các loài cá săn mồi do mùi vị khó chịu.";
    newC.unique_traits = (c.unique_traits || "") + " Sự tồn tại của dòng tế bào gốc neoblast đa năng có khả năng biệt hóa thành tất cả các dòng tế bào soma bao gồm cả tế bào thần kinh và cơ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1002/wdev.258",
        "label": "WIREs Developmental Biology - Planarian regeneration and stem cells"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Khi bị cắt nhỏ, sán kế hoạch tự tổ chức lại hệ trục trước-sau và lưng-bụng của chúng bằng cách phát tín hiệu qua con đường Wnt/Beta-catenin trước khi phân chia tế bào gốc để mọc cơ quan mới."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Hệ gene không chứa gen lão hóa telomere điển hình, cho phép duy trì chiều dài telomere không đổi sau vô số lần phân chia tế bào gốc neoblast."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Rất nhạy cảm với các ion kim loại nặng và hóa chất nông nghiệp trong nước, khiến chúng dễ bị biến dạng hoặc chết tế bào gốc hàng loạt."
    ];

  } else if (c.id === 'platypus') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["ấu trùng côn trùng", "tôm nước ngọt", "giun", "nòng nọc", "ốc sên nhỏ"];
    newC.activity_pattern = 'crepuscular';
    newC.lifespan_min = 10;
    newC.lifespan_max = 17;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản bằng cách đẻ trứng. Sau khi giao phối dưới nước, con cái đào hang sâu ấm áp và đẻ từ 1-3 quả trứng nhỏ vỏ dẻo dai. Trứng được ấp sát bụng mẹ trong 10 ngày. Con non sau khi nở tự liếm sữa tiết qua tuyến sữa ở lỗ chân lông da bụng mẹ.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 4.0;
    newC.conservation_status = 'NT';
    newC.size_min_mm = 400.0;
    newC.size_max_mm = 500.0;
    newC.weight_avg_g = 1500.0;

    newC.characteristics = (c.characteristics || "") + " Mỏ của chúng không có xương cứng bao bọc mà là một lớp da dẻo chứa hơn 40.000 thụ thể cơ học và 80.000 thụ thể điện trường sắp xếp theo các hàng dọc song song.";
    newC.survival_method = (c.survival_method || "") + " Lớp da sừng ở lòng bàn chân có màng bơi rộng kéo dài quá các ngón chân khi bơi, và có thể gập ngược lại phía sau khi cần đào hang bằng móng vuốt cứng.";
    newC.unique_traits = (c.unique_traits || "") + " Bộ lông dày bất thường giữ lại một lớp không khí mỏng sát da tạo lực nổi tự nhiên khi bơi và cách nhiệt tuyệt đối chống lạnh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1098/rstb.1998.0262",
        "label": "Philosophical Transactions of the Royal Society B - Electroreception in the platypus"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chất độc của thú mỏ vịt đực chứa hơn 80 loại độc tố khác nhau, thuộc các nhóm cấu trúc defensin-like peptide (DLPs), C-type natriuretic peptides (CNPs), và nerve growth factor (NGFs)."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ chế bơi phối hợp nhịp nhàng giữa hai chân trước làm mái chèo tạo lực đẩy chính, trong khi hai chân sau và đuôi dẹt làm nhiệm vụ cân bằng và điều hướng hoàn hảo."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Tuyến độc đùi của con đực chỉ sản sinh độc lực mạnh trong mùa giao phối (xuân), hạn chế khả năng tự vệ bằng chất độc vào các thời điểm khác trong năm."
    ];

  } else if (c.id === 'polar-bear') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["hải cẩu có vòng", "hải cẩu râu", "moóc con", "cá voi beluga", "xác động vật biển"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 15;
    newC.lifespan_max = 30;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh sản bằng cách đẻ con. Gấu cái giao phối vào mùa xuân, sau đó đi đào hang tuyết trú ẩn vào mùa thu. Phôi thai chỉ bắt đầu phát triển khi gấu mẹ ngủ đông. Sinh từ 1-3 con non nhỏ bé (khoảng 600g) vào giữa mùa đông. Gấu con bú sữa cực giàu béo (30%) của mẹ trong hang cho tới mùa xuân ấm áp.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 40.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 2400.0;
    newC.size_max_mm = 3000.0;
    newC.weight_avg_g = 525000.0;

    newC.characteristics = (c.characteristics || "") + " Lớp mỡ dưới da gấu Bắc Cực dày tới 10 cm, không chỉ cung cấp lớp cách nhiệt vượt trội mà còn đóng vai trò dự trữ năng lượng khổng lồ cho mùa hè đói kém.";
    newC.survival_method = (c.survival_method || "") + " Sở hữu đôi tai và đuôi rất nhỏ, giúp giảm thiểu tối đa diện tích tiếp xúc tỏa nhiệt ra môi trường không khí lạnh giá của Bắc Cực.";
    newC.unique_traits = (c.unique_traits || "") + " Thể hiện sự chọn lọc tự nhiên mạnh mẽ trên gen APOB chịu trách nhiệm vận chuyển lipid huyết thanh, giúp loại bỏ LDL-cholesterol có hại ra khỏi máu một cách thần kỳ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.cell.2014.03.054",
        "label": "Cell - Polar bear genomes reveal rapid adaptation to high-fat diet"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Gấu Bắc Cực có thể đánh hơi thấy lỗ thở của hải cẩu nằm sâu dưới lớp tuyết dày hơn 1 mét từ khoảng cách xa hàng kilômét nhờ hệ thống xoang mũi cực rộng."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Lông rỗng của chúng hoạt động như những ống dẫn sợi quang tự nhiên, thu thập tia bức xạ cực tím của mặt trời hướng thẳng vào lớp da đen cách nhiệt bên dưới."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Cơ thể của chúng cách nhiệt hoàn hảo đến mức nếu gấu chạy quá nhanh trong thời gian ngắn trên cạn, nó sẽ nhanh chóng rơi vào tình trạng sốc nhiệt nguy cấp."
    ];

  } else if (c.id === 'pom-pom-crab') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["tảo biển", "mảnh vụn hữu cơ", "động vật thân mềm tí hon", "thức ăn thừa của hải quỳ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 3;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản bằng cách đẻ trứng. Cua cái thụ tinh mang theo bọc trứng lớn màu cam tươi dưới bụng để bảo vệ cho đến khi trứng chuyển sang màu sẫm và nở thành ấu trùng zoea bơi tự do trôi nổi theo dòng nước.';
    newC.locomotion = 'crawl';
    newC.speed_max = 0.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 15.0;
    newC.size_max_mm = 25.0;
    newC.weight_avg_g = 7.5;

    newC.characteristics = (c.characteristics || "") + " Càng của cua đấm bốc có cấu trúc ngạnh gai mảnh và nhọn hướng ngược lại, đóng vai trò như những chiếc ghim kẹp chuyên dụng khóa chặt thân hải quỳ Triactis producta mà không làm nát mô của chúng.";
    newC.survival_method = (c.survival_method || "") + " Cua đấm bốc điều khiển dinh dưỡng của hải quỳ bằng cách cướp trực tiếp thức ăn từ xúc tu hải quỳ, giữ hải quỳ ở kích thước nhỏ dễ cầm nắm.";
    newC.unique_traits = (c.unique_traits || "") + " Hành vi xé đôi hải quỳ vô cùng điêu luyện, khi cua bị mất một hải quỳ, nó sẽ kéo dãn chiếc còn lại và dùng chân xé đôi thân hải quỳ ra để tái tạo thành hai cá thể độc lập bám vào hai càng.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.7717/peerj.2910",
        "label": "PeerJ - Asexual reproduction of sea anemones induced by boxer crabs"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Cua đấm bốc hiếm khi sử dụng càng của mình cho mục đích ăn uống hay đào bới thông thường; các hoạt động này hoàn toàn do cặp chân ngực thứ nhất đảm nhiệm."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng ngụy trang vật lý vượt trội nhờ cơ cấu mai lốm đốm hoa văn màu đỏ gạch và hồng nhạt tương thích tuyệt đối với các mảnh san hô vỡ đáy biển nông."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Nếu bị tước mất cả hai chiếc găng tay hải quỳ, cua đấm bốc sẽ rơi vào trạng thái hoảng loạn và trốn sâu dưới các khe đá hẹp do cơ thể mỏng manh không có khả năng chống trả cơ học."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
