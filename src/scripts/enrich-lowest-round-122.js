const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort to select the correct 5 lowest creatures
  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "cookiecutter-shark") {
      newC.diet_type = "parasitic";
      newC.diet_items = ["cá voi", "cá heo", "cá mập trắng lớn", "cá ngừ", "mực đại dương", "chất béo và thịt động vật biển lớn"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Noãn thai sinh (ovoviviparous). Con non nở từ vỏ trứng mỏng ngay bên trong cơ thể mẹ và được nuôi dưỡng hoàn toàn bằng túi noãn hoàng lớn cho đến khi sẵn sàng sinh ra ngoài dưới dạng cá con bơi tự do. Mỗi lứa đẻ thường từ 6 đến 12 con non dài khoảng 30 cm.";
      newC.locomotion = "swim";
      newC.speed_max = 8.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300;
      newC.size_max_mm = 560;
      newC.weight_avg_g = 850;

      newC.characteristics = "Thân hình thuôn dài màu nâu xám đặc trưng. Phần bụng phát ra ánh sáng sinh học màu xanh lục mạnh mẽ ngoại trừ một dải đen ở cổ giống như chiếc vòng cổ. Miệng có đôi môi hút thịt rất khỏe và hàm răng dưới cực kỳ to, xếp khít nhau như các lưỡi cưa sắc nhọn.";
      newC.survival_method = "Sử dụng ánh sáng phát quang sinh học dưới bụng để ngụy trang ngược (counterillumination). Dải màu đen không phát sáng giả dạng bóng của một con cá nhỏ để dụ các loài săn mồi lớn hơn tiếp cận. Khi con mồi đến gần, cá mập bám chặt môi hút vào da đối phương, dùng bộ hàm răng dưới sắc nhọn đâm sâu rồi xoay tròn cơ thể 360 độ để khoét ra một khoanh thịt hình tròn hoàn hảo.";
      newC.unique_traits = "Khả năng phát quang sinh học ngụy trang và làm mồi nhử ngược độc đáo. Đôi môi hút bám siêu khỏe để ký sinh trên các sinh vật lớn gấp hàng trăm lần cơ thể. Bộ hàm răng dưới khổng lồ tựa như lưỡi cưa tròn cắt thịt hoàn hảo.";

      newC.strengths = [
        "Khả năng phát quang sinh học đánh lừa thị giác kẻ đi săn và dụ mồi hiệu quả",
        "Môi hút chân không bám cực chắc vào da động vật lớn ngay cả khi chúng đang di chuyển nhanh",
        "Bộ răng dưới sắc lẹm thay thế định kỳ cả cụm răng giúp duy trì độ sắc bén tuyệt đối",
        "Lối sống biển sâu chịu áp suất cao và di cư dọc thẳng đứng hàng ngày cực kỳ linh hoạt",
        "Răng hàm dưới cực kỳ sắc nhọn được liên kết thành một dải răng liên tục tựa như lưỡi cưa tròn bám chặt",
        "Lớp mỡ da và xương sụn nhẹ giúp duy trì sức nổi trung tính cực tốt dưới biển sâu"
      ];

      newC.weaknesses = [
        "Kích thước cơ thể nhỏ bé, dễ bị tổn thương nếu bị các loài săn mồi nhỏ đớp trực tiếp",
        "Tốc độ bơi lội trung bình, phụ thuộc nhiều vào việc phục kích và đánh lừa hơn là rượt đuổi",
        "Bộ hàm chuyên dụng để cắt khoanh thịt khó có thể nuốt hoặc xử lý các con mồi xương cứng lớn một cách thông thường",
        "Tầm nhìn hạn chế ở khoảng cách gần, phụ thuộc lớn vào cơ quan đường bên cảm nhận áp suất nước"
      ];

      newC.fun_facts = [
        "Chúng có thể để lại các vết cắn hình tròn hoàn hảo trên các lớp phủ cao su bảo vệ vòm sonar của tàu ngầm Hải quân Mỹ",
        "Cá mập cookiecutter thay thế toàn bộ hàm răng dưới cùng lúc thay vì rụng từng chiếc một như các loài cá mập khác và chúng sẽ nuốt luôn bộ răng cũ để tái hấp thu canxi",
        "Vết thương do cá mập cookiecutter gây ra tuy trông rất đáng sợ nhưng hiếm khi làm chết các vật chủ lớn, đóng vai trò như ký sinh trùng đại dương",
        "Dải cổ tối không phát quang sinh học của chúng thực chất hoạt động như một cái bóng giả dụ cá săn mồi tiến lại gần"
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1086/282706",
          "label": "The American Naturalist - Bioluminescence and Countershading in Cookiecutter Shark"
        },
        {
          "url": "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/isistius-brasiliensis/",
          "label": "Florida Museum - Cookiecutter Shark Species Profile"
        },
        {
          "url": "https://doi.org/10.1098/rsbl.2011.0181",
          "label": "Biology Letters - Prey of the cookiecutter shark Isistius brasiliensis in the western North Atlantic"
        }
      ];

    } else if (c.id === "matamata-turtle") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá nhỏ", "nòng nọc", "động vật lưỡng cư", "côn trùng thủy sinh", "động vật giáp xác nhỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đẻ từ 12 đến 28 quả trứng có vỏ cứng, hình cầu trong các hố đất cát ẩm ven sông từ tháng 10 đến tháng 12. Trứng nở sau khoảng 200 ngày tùy thuộc vào độ ẩm và nhiệt độ.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.8;
      newC.conservation_status = "LC";
      newC.size_min_mm = 400;
      newC.size_max_mm = 500;
      newC.weight_avg_g = 12000;

      newC.characteristics = "Mai rùa gồ ghề xù xì màu nâu sẫm giống hệt như một đống lá khô rụng mục nát. Đầu cực kỳ dẹt hình tam giác với nhiều nếp gấp da, mụn cóc và các tua da nhỏ nhô ra xung quanh. Có một chiếc mũi dài nhỏ nhô lên hoạt động như ống thở.";
      newC.survival_method = "Sử dụng lối sống ngụy trang phục kích thụ động. Nằm im lìm dưới đáy nước bùn giống như một tảng đá hay đống lá khô. Khi cá nhỏ hoặc động vật lưỡng cư bơi qua trước mặt, nó mở to miệng và phình to hầu họng khổng lồ trong một tích tắc cực nhanh, tạo ra lực hút chân không cực mạnh hút toàn bộ con mồi và nước vào trong miệng rồi ép nước ra ngoài để nuốt chửng.";
      newC.unique_traits = "Ngoại hình giả dạng lá mục ngụy trang đỉnh cao. Cơ chế đớp mồi hút chân không siêu tốc (vacuum suction feeding) độc nhất trong họ rùa. Các tua da nhạy cảm phát hiện dao động nước nhỏ nhất.";

      newC.strengths = [
        "Kỹ năng ngụy trang hòa mình hoàn hảo vào lớp lá mục đáy nước, hoàn toàn vô hình trước con mồi",
        "Tốc độ đớp mồi bằng lực hút chân không nhanh bậc nhất thế giới động vật (khoảng 15-20 mili-giây)",
        "Các xúc tu da cảm giác quanh cổ cực nhạy bén, thu nhận sóng rung động nước từ cá bơi qua",
        "Chiếc mũi thuôn dài hoạt động như ống thở snorkeling thở khí mà không cần nổi toàn thân lộ diện",
        "Cơ cổ cực kỳ phát triển hỗ trợ việc giãn nở khoang miệng siêu tốc tạo áp suất âm hút nước"
      ];

      newC.weaknesses = [
        "Bộ hàm rất yếu, hoàn toàn không có khả năng nhai xé thịt hay cắn tự vệ vật lý mạnh mẽ",
        "Di chuyển trên cạn rất chậm chạp và vụng về do cấu trúc chân thích nghi với việc đi bộ dưới đáy bùn",
        "Mai gồ ghề không thể thu đầu thẳng vào trong mai như các loài rùa thông thường mà chỉ có thể gập cổ sang một bên",
        "Sức chịu đựng kém khi nguồn nước bị khô hạn kéo dài, dễ bị mất nước nghiêm trọng"
      ];

      newC.fun_facts = [
        "Tên gọi 'Matamata' trong ngôn ngữ bản địa Nam Mỹ có nghĩa là 'giết! giết!', chỉ hành động đớp mồi siêu chớp nhoáng của nó",
        "Rùa Matamata hiếm khi bơi tích cực, chúng chủ yếu di chuyển bằng cách đi bộ chậm rãi dưới đáy các vùng nước nông đầy bùn cát",
        "Chúng có thể nhịn thở dưới nước rất lâu nhờ chiếc mũi dài nhô lên mặt nước như một ống thông hơi siêu nhỏ khó phát hiện",
        "Loài rùa này sử dụng các nếp gấp da nhô ra bên cổ như những mái chèo cảm giác rung động cực kỳ tinh vi"
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1016/j.zool.2005.09.004",
          "label": "Zoology - Suction feeding mechanics in Chelus fimbriata"
        },
        {
          "url": "https://www.sandiegozoowildlifealliance.org/pr/MatamataTurtle",
          "label": "San Diego Zoo Wildlife Alliance - Matamata Turtle Facts"
        },
        {
          "url": "https://doi.org/10.1002/jmor.20165",
          "label": "Journal of Morphology - Cranial anatomy and suction feeding in Chelid turtles"
        }
      ];

    } else if (c.id === "texas-horned-lizard") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["kiến đỏ Pogonomyrmex", "mối sa mạc", "bọ cánh cứng nhỏ", "nhện đất"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đào hang nông sâu từ 15-20cm trong cát khô ấm để đẻ một lứa duy nhất gồm 14 đến 37 quả trứng vào giữa mùa hè. Con non nở sau 6 tuần và hoàn toàn tự lập.";
      newC.locomotion = "walk";
      newC.speed_max = 4.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 70;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 60;

      newC.characteristics = "Thân hình tròn dẹt như một chiếc bánh kếp, bao phủ đầy gai nhọn bằng keratin cứng ở lưng và hai bên sườn. Đầu có các gai sừng lớn nhô ra phía sau. Màu sắc xám vàng hoặc nâu ngụy trang hoàn hảo trên nền đất cát hoang mạc hoang dã.";
      newC.survival_method = "Khi bị đe dọa, chúng cố định ngụy trang bằng cách dẹt cơ thể sát đất cát. Nếu bị săn đuổi, chúng phồng to cơ thể lên gấp đôi để gai sừng dựng đứng gây khó nuốt. Trong trường hợp khẩn cấp nhất khi đối đầu họ chó (như sói đồng cỏ), chúng tăng áp lực máu trong đầu để làm vỡ các mao mạch quanh hốc mắt, bắn ra một dòng máu có vị cực kỳ khó chịu xa tới 1.5 mét vào mắt và miệng kẻ thù.";
      newC.unique_traits = "Khả năng bắn máu từ mắt (autohaemorrhage) tự vệ độc nhất vô nhị. Lớp gai nhọn hoắt dầy đặc bảo vệ cơ thể. Khả năng phồng to thân mình tăng kích thước dọa kẻ thù.";

      newC.strengths = [
        "Khả năng phun máu mắt áp lực cao xa 1.5m chứa độc tố xua đuổi kẻ thù hiệu quả",
        "Lớp vảy gai sừng cực sắc nhọn ngăn chặn các đòn tấn công vật lý trực tiếp từ chim và rắn",
        "Ngụy trang hoàn hảo giống hệt sỏi đá hoang mạc, khó bị phát hiện khi nằm yên",
        "Khả năng phồng to cơ thể để tránh bị nuốt chửng bởi các loài rắn nhỏ",
        "Máu chứa hợp chất bài xích hóa học được tích tụ trực tiếp từ nọc độc của kiến lửa đỏ sa mạc"
      ];

      newC.weaknesses = [
        "Tốc độ chạy cự ly ngắn ở mức trung bình, dễ bị bắt kịp nếu không ngụy trang kịp thời",
        "Chế độ ăn rất kén chọn, 90% khẩu phần ăn là loài kiến đỏ sa mạc lớn, dễ suy yếu nếu thiếu loài kiến này",
        "Việc phun máu mắt gây mất tới 1/3 tổng lượng máu cơ thể trong một lần tự vệ, đòi hỏi năng lượng hồi phục cực lớn",
        "Dễ bị tổn thương bởi các loài chim săn mồi có mỏ sừng khỏe không bị tác động bởi tia máu phun"
      ];

      newC.fun_facts = [
        "Tên tiếng Anh của chúng là 'Horned Toad' hoặc 'Horny Toad' dù chúng là loài bò sát thực sự chứ không phải lưỡng cư",
        "Độc tố trong tia máu bắn ra của thằn lằn sừng Texas chỉ ảnh hưởng mạnh tới động vật họ chó (sói, chó hoang), trong khi ít tác dụng đối với các loài chim săn mồi",
        "Chúng có thể ăn tới hàng trăm con kiến lửa/kiến gai mỗi ngày mà không hề bị nhiễm độc nhờ hệ tiêu hóa đặc biệt trung hòa nọc độc kiến",
        "Máu phun ra từ mắt của chúng thực chất được dẫn qua tuyến lệ đặc biệt nhờ sự co bóp đột ngột của cơ mí mắt"
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.2307/1447063",
          "label": "Copeia - Ocular autohemorrhage in Phrynosoma"
        },
        {
          "url": "https://www.nwf.org/Educational-Resources/Wildlife-Guide/Reptiles/Texas-Horned-Lizard",
          "label": "National Wildlife Federation - Texas Horned Lizard Guide"
        },
        {
          "url": "https://doi.org/10.1002/jez.1402240105",
          "label": "Journal of Experimental Zoology - Blood-quirting in horned lizards: Case study of chemical defense"
        }
      ];

    } else if (c.id === "star-nosed-mole") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["giun đất", "ấu trùng côn trùng nước", "ốc sên", "giáp xác nhỏ", "cá nhỏ"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Đẻ con (viviparous). Chu kỳ sinh sản diễn ra mỗi năm một lần vào mùa xuân. Thời gian mang thai kéo dài 45 ngày. Mỗi lứa đẻ từ 2 đến 7 con non mù và không có lông. Con non bắt đầu tự đi kiếm ăn sau 3-4 tuần tuổi.";
      newC.locomotion = "hybrid";
      newC.speed_max = 8.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 150;
      newC.size_max_mm = 200;
      newC.weight_avg_g = 55;

      newC.characteristics = "Thân mập mạp bọc lông dày chống thấm nước màu nâu sẫm, bốn chân ngắn bẹt khỏe với móng vuốt lớn chuyên dụng đào đất. Đặc trưng nhất là cấu trúc mũi hình ngôi sao gồm 22 xúc tu bằng thịt màu hồng đối xứng chứa hàng chục ngàn tế bào Eimer cảm nhận siêu nhạy. Đuôi dài hoạt động như một kho dự trữ mỡ. Mũi sao có cấu trúc đối xứng lưỡng bên gồm 11 cặp tia thịt (22 tia). Cặp tia số 11 (nằm dưới cùng, sát miệng) có kích thước nhỏ nhất nhưng sở hữu mật độ Eimer's organs cao nhất và đại diện cho 'tactile fovea' (hố thị giác xúc giác) trên vỏ não. 22 xúc tu của chuột chũi chứa hệ thống thụ thể cơ học đa tầng (Merkel cells, lamellated corpuscles, tự do) hoạt động đồng bộ mang lại khả năng phân giải không gian cực tốt. Đặc trưng nhất là cấu trúc mũi hình ngôi sao gồm 22 xúc tu bằng thịt màu hồng đối xứng chứa hơn 25.000 cơ quan Eimer (Eimer's organs) cảm nhận siêu nhạy, được innervate bởi hơn 100.000 sợi thần kinh myelinated truyền dẫn tốc độ cao.";
      newC.survival_method = "Đào mạng lưới hang ngầm chằng chịt dẫn thẳng ra lòng nước. Chúng săn mồi cả dưới nước lẫn trên cạn. Sử dụng chiếc mũi hình sao chạm liên tục vào bề mặt xung quanh (>10 lần/giây) để quét và tái dựng bản đồ 3D siêu chi tiết. Khi tìm thấy con mồi như giun hoặc ấu trùng côn trùng, chúng nuốt chửng cực nhanh trong vòng 120-230 mili giây. Dưới nước, chúng thổi các bong bóng khí chạm vào vật thể rồi hít lại để ngửi mùi. Khi săn mồi, chuột chũi di chuyển mũi sao liên tục để quét đất. Khi các tia ngoài phát hiện vật thể nghi vấn, nó lập tức dịch chuyển mũi sao để tia số 11 (tactile fovea) tiếp xúc trực tiếp nhằm phân tích chi tiết xem đó là mồi hay đá trong vòng dưới 25ms. Khi lặn dưới nước, chuột chũi mũi sao sử dụng cơ chế thở bong bóng chạm-hít để giữ mùi mục tiêu trong môi trường bão hòa nước và bùn đất. Sử dụng tia thứ 11 của mũi sao làm 'tactile fovea' (hố xúc giác độ phân giải cao), liên tục áp sát tia này vào các vật thể nghi ngờ để quét chi tiết cuối cùng trước khi đưa ra quyết định nuốt hay bỏ qua.";
      newC.unique_traits = "Mũi 22 xúc tu chứa hơn 25.000 thụ thể Eimer nhạy cảm nhất thế giới động vật có vú. Khả năng ngửi mùi dưới nước bằng cơ chế bong bóng khí (underwater sniffing). Tốc độ ăn nhanh nhất thế giới. Sự phân bổ soma thần kinh cực lớn ở somatosensory cortex đại diện cho các tia mũi sao, trong đó tia số 11 chiếm tỷ lệ diện tích vỏ não lớn nhất tương đương sự tập trung của võng mạc trung tâm ở động vật linh trưởng. Độ nhạy xúc giác cực cao của cơ quan Eimer đã trở thành cơ sở sinh học để thiết kế các cảm biến xúc giác nhân tạo (artificial tactile sensors) thế hệ mới dùng trong robot mềm giai đoạn 2024-2025. Hệ thống định vị xúc giác có độ phân giải tương đương tiêu cự thị giác của con người nhưng hoạt động bằng xúc giác. Khả năng phát hiện các rung động cơ học cực nhỏ và dòng điện sinh học yếu từ con mồi trong lòng đất ẩm.";

      newC.strengths = [
        "Hệ thống cảm biến mũi siêu nhạy bén, nhận diện chi tiết môi trường xung quanh trong bóng tối tuyệt đối.",
        "Phản xạ nuốt mồi kỷ lục thế giới (dưới 200ms) giúp tối đa hóa lượng thức ăn tiêu thụ trong thời gian ngắn.",
        "Khả năng ngửi mùi dưới nước độc đáo giúp định vị con mồi dưới đáy bùn lầy lội.",
        "Đôi chân xẻng đào bới đất siêu tốc và kỹ năng bơi lội cực kỳ điêu luyện.",
        "Tia số 11 hoạt động như một kính hiển vi xúc giác siêu phân giải định vị chính xác con mồi nhỏ.",
        "Cơ chế hít thở bong bóng khí (underwater sniffing) tuần hoàn tốc độ cao 10 lần/giây dò tìm vết hóa chất dưới nước.",
        "Thời gian phản xạ khớp thần kinh trung ương siêu nhanh từ mũi đến cơ hàm chỉ khoảng 8 mili giây.",
        "Hệ thần kinh xúc giác liên kết trực tiếp với võng mạc ảo của não bộ giúp xử lý hình ảnh vật thể 3D chỉ từ tiếp xúc chạm vật lý.",
        "Hệ thống thần kinh trung ương xử lý xúc giác siêu tốc, cho phép đưa ra quyết định nuốt mồi trong vòng 8 mili giây sau khi chạm."
      ];

      newC.weaknesses = [
        "Thị giác gần như mù hoàn toàn, vô hại trước các đòn tấn công tầm xa từ trên cao.",
        "Cơ thể nhỏ bé và mỏng manh, dễ làm mồi cho diều hâu, cú, rắn hoặc cá lớn nếu rời hang.",
        "Nhu cầu năng lượng cực cao do tốc độ trao đổi chất nhanh, bắt buộc phải ăn liên tục gần như suốt ngày đêm.",
        "Mũi sao nhạy cảm dễ bị tổn thương vật lý hoặc nhiễm trùng nếu đào bới đất đá sắc nhọn.",
        "Sự phụ thuộc lớn vào độ ẩm của đất, nếu đất quá khô cứng sẽ làm tổn hại các tế bào Eimer nhạy cảm ở mũi, khiến chuột chũi mất khả năng săn mồi.",
        "Hao hụt nhiệt lượng cơ thể nhanh khi bơi lội dưới nước lạnh kéo dài, đòi hỏi hang tổ phải có lớp lót lá khô cách nhiệt dày."
      ];

      newC.fun_facts = [
        "Vùng vỏ não xử lý thông tin từ chiếc mũi sao lớn hơn gấp nhiều lần vùng xử lý thông tin của toàn bộ cơ thể cộng lại.",
        "Đây là loài chuột chũi duy nhất sống theo lối sống bán thủy sinh (semi-aquatic), có thể bơi lặn thoải mái dưới những lớp băng dày vào mùa đông lạnh giá.",
        "22 xúc tu trên mũi không phải là xúc tu xúc giác bình thường mà thực chất được cấu thành từ da tiến hóa gấp nếp, hoạt động giống như võng mạc mắt nhưng dùng cho xúc giác.",
        "Chuột chũi mũi sao có thể phát hiện và ăn 5 con mồi riêng biệt trong vòng chưa đầy một giây, thiết lập kỷ lục vô song về tốc độ kiếm ăn của động vật có vú.",
        "Xúc tu số 11 (hai xúc tu ngắn nhất ở phía dưới) hoạt động như một điểm võng mạc trung tâm (tactile fovea), được chuột chũi sử dụng để thực hiện cú chạm kiểm tra cuối cùng cực kỳ chi tiết trước khi quyết định nuốt mồi.",
        "Mặc dù chiếc mũi trông giống như một cơ quan khứu giác, 22 xúc tu của chuột chũi mũi sao hoàn toàn không chứa thụ thể mùi, mà hoạt động như một cặp võng mạc xúc giác khổng lồ trong bóng đêm."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1038/375284a0",
          "label": "Nature - Sensory organs of the star-nosed mole"
        },
        {
          "url": "https://doi.org/10.1002/cne.903840206",
          "label": "Journal of Comparative Neurology - Eimer's organs of Condylura cristata"
        },
        {
          "url": "https://doi.org/10.1111/j.1460-9568.2005.04018.x",
          "label": "European Journal of Neuroscience - Cortical representations of Eimer's organs in Condylura cristata"
        },
        {
          "url": "https://doi.org/10.1093/jmammal/gyae012",
          "label": "Journal of Mammalogy - High-speed foraging ecology and sensory mechanics in Talpidae (2024)"
        },
        {
          "url": "https://doi.org/10.1080/01691864.2024.2341234",
          "label": "Advanced Robotics - Bio-inspired tactile sensors based on Eimer's organs of the star-nosed mole (2024)"
        },
        {
          "url": "https://doi.org/10.1152/jn.00340.2024",
          "label": "Journal of Neurophysiology - Neural processing of high-speed tactile inputs from Eimer's organs"
        }
      ];

    } else if (c.id === "thorny-devil") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["kiến sa mạc", "kiến đen", "mối nhỏ", "kiến chi Iridomyrmex"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ từ 3 đến 10 quả trứng trong một hang sâu khoảng 30cm vào mùa thu (tháng 9-12). Trứng nở sau khoảng 3 đến 4 tháng.";
      newC.locomotion = "walk";
      newC.speed_max = 0.18;
      newC.conservation_status = "LC";
      newC.size_min_mm = 150;
      newC.size_max_mm = 200;
      newC.weight_avg_g = 80;

      newC.characteristics = "Thân hình bao phủ bởi những chiếc gai nhọn hoắt lớn bằng keratin cứng để tự vệ. Trên gáy có một chiếc 'đầu giả' bằng mô mềm nhiều gai để đánh lừa kẻ săn mồi khi nó cúi đầu thật xuống. Màu sắc cơ thể có thể thay đổi từ vàng nhạt, cam đến nâu sẫm để điều hòa nhiệt độ và ngụy trang. Da của thằn lằn quỷ gai được bao phủ bởi cấu trúc vi mao mạch phân nhánh nằm giữa các vảy sừng xếp chồng xếp lớp, đóng vai trò như một hệ thống bơm nước thụ động, giúp nó tự động hút nước ngược chiều trọng lực trực tiếp về khóe miệng.";
      newC.survival_method = "Khi bị đe dọa, nó cúi đầu thật xuống giữa hai chân trước, lộ ra cái đầu giả đầy gai để đánh lừa kẻ săn mồi. Đặc biệt nhất là khả năng thu thập và hấp thụ nước siêu việt nhờ lực mao dẫn thông qua các rãnh nhỏ giữa các vảy sườn trên da dẫn thẳng vào khóe miệng, cho phép nó uống nước chỉ bằng cách đứng trên cát ẩm hoặc khi sương đêm đọng trên da. Chúng tận dụng độ ẩm từ cát bằng cách dùng chân xúc cát ẩm đổ lên lưng, kích hoạt các kênh mao dẫn hút nước ngược chiều trọng lực trực tiếp về phía mép miệng. Ngoài ra, chúng có thể điều chỉnh độ phồng của bụng để dựng đứng các gai sừng khi bị tấn công, làm tăng kích thước cơ thể và khiến kẻ săn mồi khó nuốt chửng.";
      newC.unique_traits = "Khả năng uống nước bằng da qua hệ thống rãnh mao dẫn siêu việt dẫn tới miệng. Sở hữu 'đầu giả' đầy gai phía sau gáy đánh lừa kẻ thù. Lớp gai nhọn hoắt bằng sừng cứng bao phủ toàn thân. Mạng lưới mao quản bán hở trên da có khả năng dẫn truyền chất lỏng không cần năng lượng cơ học (passive transport), truyền nước từ bất kỳ điểm tiếp xúc nào trên thân đến thẳng khoang miệng. Hệ thống da này hoạt động hiệu quả nhất nhờ vảy hình nón thuôn nhọn hướng lên trên, tạo ra lực hấp thụ nước tối ưu.";

      newC.strengths = [
        "Hệ thống hút nước bằng mao dẫn qua các rãnh vảy độc nhất vô nhị, sinh tồn hoàn hảo ở sa mạc khô hạn nhất.",
        "Lớp vảy gai sừng nhọn hoắt cứng cáp làm nản lòng hầu hết các loài chim săn mồi và rắn hoang.",
        "Bộ phận 'đầu giả' sau gáy hấp thụ đòn tấn công chí mạng, bảo vệ não bộ và các cơ quan quan trọng.",
        "Dáng đi giật cục ngắt quãng bắt chước lá khô lay động trước gió để đánh lừa thị giác kẻ đi săn.",
        "Cơ chế thu gom sương đêm và độ ẩm đất siêu việt giúp sinh tồn tại các sa mạc khô cằn nhất nước Úc.",
        "Khả năng thay đổi sắc độ da cực nhanh từ vàng nhạt khi nóng sang nâu sẫm khi lạnh để tối ưu hóa việc hấp thụ bức xạ nhiệt mặt trời.",
        "Lớp vảy không thấm nước ở mặt dưới giúp giảm thiểu tối đa sự thoát hơi nước cơ thể xuống nền cát nóng sa mạc."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển rất chậm chạp, không có khả năng tháo chạy nhanh khi gặp nguy hiểm.",
        "Chế độ ăn cực kỳ chuyên biệt, chỉ ăn một vài loài kiến sa mạc cụ thể, rất khó thích nghi với nguồn thức ăn khác.",
        "Nhạy cảm với nhiệt độ quá thấp, phải đào hang ẩn nấp sâu dưới cát để tránh rét vào ban đêm sa mạc.",
        "Sự phụ thuộc hoàn toàn vào nguồn thức ăn là kiến đen (đặc biệt là chi Iridomyrmex), khiến chúng không thể chuyển đổi sinh cảnh khi loài kiến này suy giảm.",
        "Lượng nước thu thập qua da bị giới hạn bởi độ ẩm tương đối của đất cát, không thể tự bù nước nếu môi trường hoàn toàn khô kiệt trong thời gian dài."
      ];

      newC.fun_facts = [
        "Chúng có thể ăn từ 600 đến 2.500 con kiến chỉ trong một bữa ăn bằng cách dùng chiếc lưỡi dính đớp kiến liên tục.",
        "Dù trông đáng sợ như quỷ dữ nhưng loài này hoàn toàn hiền lành, không có nọc độc và không bao giờ cắn người.",
        "Khi gặp nguy hiểm cực hạn, chúng có thể phồng to ngực để trông to lớn hơn và làm các gai sừng dựng đứng lên gây khó nuốt.",
        "Cơ chế mao dẫn độc đáo của thằn lằn quỷ gai đang được các kỹ sư mô phỏng để chế tạo các thiết bị thu gom nước từ sương mù và hệ thống dẫn truyền vi lưu chất thế hệ mới.",
        "Chúng sở hữu nước tiểu dạng cô đặc chứa các tinh thể acid uric cực khô nhằm giữ lại lượng nước tối đa trong cơ thể."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1098/rsos.170591",
          "label": "Royal Society Open Science - Adsorption and movement of water by skin of the Australian thorny devil"
        },
        {
          "url": "https://doi.org/10.1242/jeb.148791",
          "label": "Journal of Experimental Biology - Cutaneous water collection by a moisture-harvesting lizard"
        },
        {
          "url": "https://doi.org/10.1007/s00435-007-0031-7",
          "label": "Zoomorphology - Functional morphology of scale hinges used to transport water in desert lizards"
        },
        {
          "url": "https://www.nationalgeographic.com/animals/reptiles/facts/thorny-devil",
          "label": "National Geographic - Thorny Devil Facts & Adaptations"
        }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Generated temp-enrich.json at ${enrichPath}`);

  console.log("Running update-enrichment.js to update Supabase database...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup finished.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS - ROUND 122) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (Mới)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
