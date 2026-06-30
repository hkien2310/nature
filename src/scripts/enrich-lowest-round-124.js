const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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
      newC.diet_items = [
        "cá voi",
        "cá heo",
        "cá mập trắng lớn",
        "cá ngừ",
        "mực đại dương",
        "chất béo và thịt động vật biển lớn",
        "cá kiếm",
        "hải cẩu"
      ];
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

      newC.characteristics = "Thân hình thuôn dài màu nâu xám đặc trưng. Phần bụng phát ra ánh sáng sinh học màu xanh lục mạnh mẽ từ hàng nghìn tế bào photophores, ngoại trừ một dải đen ở cổ giống như chiếc vòng cổ. Miệng có đôi môi hút thịt rất khỏe tạo áp suất chân không và hàm răng dưới cực kỳ to, xếp khít nhau như các lưỡi cưa sắc nhọn.";
      newC.survival_method = "Sử dụng ánh sáng phát quang sinh học dưới bụng để ngụy trang ngược (counterillumination) hòa mình vào ánh sáng mặt trời rọi xuống. Dải màu đen không phát sáng giả dạng bóng của một con cá nhỏ để dụ các loài săn mồi lớn hơn tiếp cận. Khi con mồi đến gần, cá mập bám chặt môi hút vào da đối phương tạo áp suất âm, dùng bộ hàm răng dưới sắc nhọn đâm sâu rồi xoay tròn cơ thể 360 độ để khoét ra một khoanh thịt hình tròn hoàn hảo.";
      newC.unique_traits = "Khả năng phát quang sinh học ngụy trang và làm mồi nhử ngược độc đáo nhờ hàng ngàn tế bào phát sáng. Đôi môi hút bám siêu khỏe tạo lực hút chân không để ký sinh trên các sinh vật lớn gấp hàng trăm lần cơ thể. Bộ hàm răng dưới khổng lồ tựa như lưỡi cưa tròn cắt thịt hoàn hảo, có thể rụng và nuốt lại cả cụm răng để tái chế canxi. Ngoài ra, da của chúng có các tế bào cảm nhận chênh lệch áp suất cực kỳ nhạy bén giúp phát hiện sự dịch chuyển của vật chủ lớn từ xa.";

      newC.strengths = [
        "Khả năng phát quang sinh học ngụy trang ngược (counterillumination) và làm mồi nhử ngược độc đáo dưới đáy biển sâu.",
        "Môi hút chân không tạo áp suất âm siêu khỏe bám cực chắc vào da động vật lớn ngay cả khi chúng đang bơi với tốc độ cao.",
        "Bộ răng dưới sắc lẹm thay thế định kỳ cả cụm răng giúp duy trì độ sắc bén tuyệt đối để cắt thịt.",
        "Lối sống biển sâu chịu áp suất cao cực tốt và khả năng di cư dọc thẳng đứng hàng ngày lên tới 3.000m.",
        "Răng hàm dưới cực kỳ sắc nhọn được liên kết thành một dải răng liên tục tựa như lưỡi cưa tròn để xoay cắn.",
        "Lớp mỡ da dày và xương sụn nhẹ giúp duy trì sức nổi trung tính cực tốt mà không tốn năng lượng bơi.",
        "Tạo ra các vết cắn hình tròn hoàn hảo sâu vào lớp mỡ dưới da động vật mà không đánh động hệ thần kinh cảm giác của vật chủ ngay lập tức nhờ chất gây tê tự nhiên."
      ];

      newC.weaknesses = [
        "Kích thước cơ thể nhỏ bé, dễ bị tổn thương nếu bị các loài săn mồi tầm trung đớp trực tiếp.",
        "Tốc độ bơi lội trung bình, phụ thuộc nhiều vào việc phục kích, trôi nổi và đánh lừa thị giác hơn là rượt đuổi.",
        "Bộ hàm chuyên dụng để cắt khoanh thịt khó có thể nuốt hoặc xử lý các con mồi xương cứng lớn một cách thông thường.",
        "Tầm nhìn hạn chế ở khoảng cách gần trong bóng tối, phụ thuộc lớn vào cơ quan cảm nhận cơ học.",
        "Tiêu hao năng lượng cực lớn sau mỗi đợt di cư thẳng đứng thẳng hàng ngàn mét từ biển sâu lên mặt nước."
      ];

      newC.fun_facts = [
        "Chúng có thể để lại các vết cắn hình tròn hoàn hảo trên các lớp phủ cao su bảo vệ vòm sonar của tàu ngầm Hải quân Mỹ.",
        "Cá mập cookiecutter thay thế toàn bộ hàm răng dưới cùng lúc thay vì rụng từng chiếc một như các loài cá mập khác và chúng sẽ nuốt luôn bộ răng cũ để tái hấp thu canxi.",
        "Vết thương do cá mập cookiecutter gây ra tuy trông rất đáng sợ nhưng hiếm khi làm chết các vật chủ lớn, đóng vai trò như ký sinh trùng đại dương.",
        "Dải cổ tối không phát quang sinh học của chúng thực chất hoạt động như một cái bóng giả dụ cá săn mồi tiến lại gần.",
        "Chúng có hệ thống phát quang sinh học mạnh mẽ và bền bỉ nhất trong số các loài cá mập, có khả năng phát sáng liên tục nhiều giờ sau khi đưa lên khỏi nước."
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
        },
        {
          "url": "https://en.wikipedia.org/wiki/Cookiecutter_shark",
          "label": "Wikipedia - Isistius brasiliensis Detailed Biology"
        }
      ];
    } else if (c.id === "matamata-turtle") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cá nhỏ",
        "nòng nọc",
        "ếch nhái",
        "côn trùng thủy sinh",
        "động vật không xương sống"
      ];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sinh sản hữu tính, đẻ trứng. Con cái đẻ từ 12 đến 28 quả trứng có vỏ cứng trong các hốc đất cát ven sông vào cuối mùa khô. Trứng cần khoảng 200 ngày ấp ở nhiệt độ ấm áp để nở thành con non.";
      newC.locomotion = "hybrid";
      newC.speed_max = 1.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 400;
      newC.size_max_mm = 500;
      newC.weight_avg_g = 12000;

      newC.characteristics = "Mai rùa gồ ghề xù xì màu nâu sẫm giống hệt như một đống lá khô rụng mục nát tích tụ nhiều rêu tảo. Đầu cực kỳ dẹt hình tam giác với nhiều nếp gấp da, mụn cóc và các tua da nhỏ nhô ra xung quanh đóng vai trò cảm biến rung động. Có một chiếc mũi dài nhỏ nhô lên hoạt động như ống thở snorkeling.";
      newC.survival_method = "Sử dụng lối sống ngụy trang phục kích thụ động hòa mình vào lớp bùn cát đáy sông. Nằm im lìm dưới đáy nước bùn giống như một tảng đá hay đống lá khô. Khi cá nhỏ hoặc động vật lưỡng cư bơi qua trước mặt, nó mở to miệng và phình to hầu họng khổng lồ nhờ bộ xương móng (hyoid apparatus) trong một tích tắc cực nhanh (khoảng 15-20 mili giây), tạo ra lực hút chân không cực mạnh hút toàn bộ con mồi và nước vào trong miệng rồi ép nước ra ngoài để nuốt chửng.";
      newC.unique_traits = "Ngoại hình giả dạng lá mục ngụy trang đỉnh cao hoàn hảo. Cơ chế đớp mồi hút chân không siêu tốc (vacuum suction feeding) độc nhất nhờ sự mở rộng khoang miệng và hầu họng nhanh kỷ lục dưới 1/50 giây. Các tua da nhạy cảm phát hiện dao động nước nhỏ nhất giúp định vị con mồi mà không cần thị giác tốt.";

      newC.strengths = [
        "Kỹ năng ngụy trang hòa mình hoàn hảo vào lớp lá mục đáy nước, hoàn toàn vô hình trước con mồi.",
        "Tốc độ đớp mồi bằng lực hút chân không nhanh bậc nhất thế giới động vật (khoảng 15-20 mili-giây).",
        "Các xúc tu da cảm giác quanh cổ cực nhạy bén, thu nhận sóng rung động nước từ cá bơi qua.",
        "Chiếc mũi thuôn dài hoạt động như ống thở snorkeling thở khí mà không cần nổi toàn thân lộ diện.",
        "Cơ cổ cực kỳ phát triển hỗ trợ việc giãn nở khoang miệng siêu tốc tạo áp suất âm hút nước.",
        "Khả năng phục kích thụ động nhịn ăn cực lâu để giảm thiểu tiêu thụ năng lượng.",
        "Lớp mai sần sùi với các gờ sừng cứng giúp phân tán áp lực cơ học từ hàm răng của kẻ săn mồi lớn."
      ];

      newC.weaknesses = [
        "Bộ hàm rất yếu, hoàn toàn không có khả năng nhai xé thịt hay cắn tự vệ vật lý mạnh mẽ.",
        "Di chuyển trên cạn rất chậm chạp và vụng về do cấu trúc chân thích nghi với việc đi bộ dưới đáy bùn.",
        "Mai gồ ghề không thể thu đầu thẳng vào trong mai như các loài rùa thông thường mà chỉ có thể gập cổ sang một bên.",
        "Sức chịu đựng kém khi nguồn nước bị khô hạn kéo dài, dễ bị mất nước nghiêm trọng.",
        "Thính giác và thị giác kém phát triển trong nước đầm lầy, phụ thuộc hoàn toàn vào cơ quan cảm nhận cơ học bên ngoài."
      ];

      newC.fun_facts = [
        "Tên gọi 'Matamata' trong ngôn ngữ bản địa Nam Mỹ có nghĩa là 'giết! giết!', chỉ hành động đớp mồi siêu chớp nhoáng của nó.",
        "Rùa Matamata hiếm khi bơi tích cực, chúng chủ yếu di chuyển bằng cách đi bộ chậm rãi dưới đáy các vùng nước nông đầy bùn cát.",
        "Chúng có thể nhịn thở dưới nước rất lâu nhờ chiếc mũi dài nhô lên mặt nước như một ống thông hơi siêu nhỏ khó phát hiện.",
        "Loài rùa này sử dụng các nếp gấp da nhô ra bên cổ như những mái chèo cảm giác rung động cực kỳ tinh vi.",
        "Cấu trúc miệng dẹt và hầu họng siêu rộng khiến chúng không thể nhai thức ăn; thay vào đó chúng nuốt chửng con mồi còn sống nguyên vẹn."
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
        },
        {
          "url": "https://en.wikipedia.org/wiki/Mata_mata",
          "label": "Wikipedia - Mata mata Fresh Water Turtle Details"
        }
      ];
    } else if (c.id === "texas-horned-lizard") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "kiến đỏ Pogonomyrmex",
        "côn trùng nhỏ",
        "ấu trùng",
        "mối sa mạc"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sinh sản hữu tính, đẻ trứng. Con cái đào hang sâu trong cát mịn để đẻ từ 14 đến 37 quả trứng vào đầu mùa hè. Trứng nở sau khoảng 45 ngày ấp dưới sức nóng của sa mạc, con non lập tức tự lập tìm kiến ăn.";
      newC.locomotion = "walk";
      newC.speed_max = 4.8;
      newC.conservation_status = "LC";
      newC.size_min_mm = 70;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 60;

      newC.characteristics = "Thân hình tròn dẹt như một chiếc bánh kếp, bao phủ đầy gai nhọn bằng keratin cứng ở lưng và hai bên sườn. Đầu có các gai sừng lớn nhô ra phía sau. Màu sắc xám vàng hoặc nâu ngụy trang hoàn hảo trên nền đất cát hoang mạc hoang dã. Da của chúng sở hữu các rãnh liên kết vảy tinh vi dẫn nước về miệng.";
      newC.survival_method = "Khi bị đe dọa, chúng cố định ngụy trang bằng cách dẹt cơ thể sát đất cát. Nếu bị săn đuổi, chúng phồng to cơ thể lên gấp đôi để gai sừng dựng đứng gây khó nuốt. Trong trường hợp khẩn cấp nhất khi đối đầu họ chó (như sói đồng cỏ), chúng nén các tĩnh mạch lớn trong sọ làm tăng huyết áp đột ngột ở hốc mắt, làm vỡ các mao mạch quanh hốc mắt, bắn ra một dòng máu có chứa hóa chất cực độc từ kiến lửa Pogonomyrmex xa tới 1.5 mét vào mắt và miệng kẻ thù.";
      newC.unique_traits = "Khả năng bắn máu từ mắt (autohaemorrhage) tự vệ độc nhất vô nhị bằng cách tăng áp lực máu ở xoang mắt. Lớp gai nhọn hoắt dầy đặc bảo vệ cơ thể. Da có cấu trúc thu gom mưa (rain-harvesting skin) dẫn nước trực tiếp từ thân xuống miệng nhờ lực mao dẫn của các rãnh nhỏ giữa các vảy.";

      newC.strengths = [
        "Khả năng phun máu mắt áp lực cao xa 1.5m chứa độc tố bài xích xua đuổi kẻ thù họ chó cực kỳ hiệu quả.",
        "Lớp vảy gai sừng cực sắc nhọn ngăn chặn các đòn tấn công vật lý trực tiếp từ chim và rắn.",
        "Ngụy trang hoàn hảo giống hệt sỏi đá hoang mạc, khó bị phát hiện khi nằm yên.",
        "Khả năng phồng to cơ thể để tránh bị nuốt chửng bởi các loài rắn nhỏ.",
        "Máu chứa hợp chất bài xích hóa học độc tố kiến được tích tụ trực tiếp từ nọc độc của kiến lửa Pogonomyrmex.",
        "Da rain-harvesting thông minh hấp thụ hơi nước và sương đêm qua các mao mạch nhỏ dẫn về miệng uống.",
        "Hệ tiêu hóa chuyên biệt có khả năng trung hòa hoàn toàn lượng nọc độc kiến axit formic đậm đặc ăn vào mỗi ngày."
      ];

      newC.weaknesses = [
        "Tốc độ chạy cự ly ngắn ở mức trung bình, dễ bị bắt kịp nếu không ngụy trang kịp thời.",
        "Chế độ ăn rất kén chọn, 90% khẩu phần ăn là loài kiến đỏ sa mạc lớn, dễ suy yếu nếu thiếu loài kiến này.",
        "Việc phun máu mắt gây mất tới 1/3 tổng lượng máu cơ thể trong một lần tự vệ, đòi hỏi năng lượng hồi phục cực lớn.",
        "Dễ bị tổn thương bởi các loài chim săn mồi có mỏ sừng khỏe không bị tác động bởi tia máu phun.",
        "Hoàn toàn phụ thuộc vào nhiệt độ môi trường để điều hòa thân nhiệt, hạn chế hoạt động vào những giờ quá nóng hoặc lạnh."
      ];

      newC.fun_facts = [
        "Tên tiếng Anh của chúng là 'Horned Toad' hoặc 'Horny Toad' dù chúng là loài bò sát thực sự chứ không phải lưỡng cư.",
        "Độc tố trong tia máu bắn ra của thằn lằn sừng Texas chỉ ảnh hưởng mạnh tới động vật họ chó (sói, chó hoang), trong khi ít tác dụng đối với các loài chim săn mồi.",
        "Chúng có thể ăn tới hàng trăm con kiến lửa/kiến gai mỗi ngày mà không hề bị nhiễm độc nhờ hệ tiêu hóa đặc biệt trung hòa nọc độc kiến.",
        "Máu phun ra từ mắt của chúng thực chất được dẫn qua tuyến lệ đặc biệt nhờ sự co bóp đột ngột của cơ mí mắt.",
        "Khi trời mưa, chúng áp bụng xuống đất cát và chổng mông lên cao để tạo góc dốc cho nước mưa chảy xuôi theo lưng đi thẳng vào khóe miệng."
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
        },
        {
          "url": "https://en.wikipedia.org/wiki/Texas_horned_lizard",
          "label": "Wikipedia - Phrynosoma cornutum Taxonomy and Physiology"
        }
      ];
    } else if (c.id === "bioluminescent-ostracod") {
      newC.diet_type = "detritivore";
      newC.diet_items = [
        "chất hữu cơ phân hủy",
        "xác động vật nhỏ",
        "tảo biển",
        "mảnh vụn sinh học"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản hữu tính. Con đực thực hiện các màn trình diễn ánh sáng nhấp nháy phức tạp để thu hút con cái. Sau khi giao phối, con cái mang phôi trứng trong túi ấp dưới vỏ cho đến khi chúng nở thành ấu trùng tự bơi.";
      newC.locomotion = "swim";
      newC.speed_max = 0.15;
      newC.conservation_status = "LC";
      newC.size_min_mm = 1.5;
      newC.size_max_mm = 2.0;
      newC.weight_avg_g = 0.0005;

      newC.characteristics = "Thân hình siêu nhỏ được bao bọc bởi một lớp vỏ hai mảnh dẹt bằng chitin mỏng và trong suốt như hạt vừng. Sở hữu tuyến phát quang ở môi trên chứa hai hợp chất hóa học là luciferin (vargulin) và enzyme luciferase dạng hạt khô riêng biệt. Khi bị kích thích hoặc gặp nguy hiểm, chúng đồng thời phun hai hạt này ra môi trường nước tạo ra phản ứng oxy hóa phát quang ánh sáng xanh dương chói lọi kéo dài vài giây. Tuyến môi trên bao gồm hai loại tế bào tuyến hình ống riêng lẻ đổ ra ngoài môi bằng các lỗ nhỏ giúp kiểm soát tốc độ phun.";
      newC.survival_method = "Sống vùi mình trong cát ban ngày để tránh kẻ săn mồi. Ban đêm bơi lội tự do tìm kiếm chất hữu cơ phân hủy hoặc động vật nhỏ chết. Khi bị cá nhỏ nuốt vào miệng, chúng lập tức phun ra dịch hóa học phát quang màu xanh dương chói lọi làm sáng rực toàn bộ khoang miệng của cá. Ánh sáng này biến cá thành mục tiêu hiển lộ rõ ràng trước kẻ săn mồi lớn hơn (hiệu ứng báo động chống săn mồi), buộc cá phải nhè bọ giáp cổ ra ngay lập tức để tự bảo vệ. Trong bóng tối, chúng cảm nhận dòng chảy và hóa chất mồi nhờ râu xúc giác phủ đầy tơ cảm giác. Bọ giáp cổ có khả năng độc đáo tự tổng hợp vargulin trực tiếp từ ba loại axit amin: tryptophan, arginine và isoleucine.";
      newC.unique_traits = "Khả năng phun chất hóa học tự vệ phát quang sinh học xanh dương cô đặc (luciferin-luciferase). Phản ứng phát quang cực kỳ hiệu quả hầu như không sinh ra nhiệt lượng (ánh sáng lạnh). Luciferin của bọ giáp cổ (vargulin) có cấu trúc hóa học cực kỳ ổn định, có thể bảo quản khô rực sáng lại sau hàng thập kỷ khi gặp nước. Bước sóng phát sáng cực đỉnh ở mức 460nm là bước sóng tối ưu giúp ánh sáng truyền đi xa nhất trong môi trường nước biển ven bờ. Hệ thống tuyến phát quang tiến hóa theo cơ chế đồng biểu hiện (co-expression) gen luciferase với các gen bài tiết cổ xưa.";

      newC.strengths = [
        "Pháo sáng tự vệ hóa học siêu nhạy, khắc chế tuyệt đối hành vi nuốt mồi của các loài cá nhỏ.",
        "Vỏ hai mảnh chitin trong suốt dẻo dai bảo vệ cơ thể khỏi lực ép cơ học nhẹ trong khoang miệng cá.",
        "Khả năng phát hiện thức ăn phân hủy nhanh chóng nhờ các thụ thể hóa học phát triển trên râu.",
        "Kích thước hiển vi và tập tính ẩn nấp sâu dưới lớp cát mịn làm giảm tối đa khả năng bị phát hiện.",
        "Cơ chế giải phóng chất phát quang dạng hạt cô đặc giúp tiết kiệm tối đa năng lượng sinh học.",
        "Hệ thống cơ co thắt môi trên phản xạ cực nhanh dưới 50 mili giây khi phát hiện áp lực va chạm.",
        "Khả năng tự sản sinh cơ chất phát quang nội sinh vargulin từ các axit amin cơ bản.",
        "Đôi mắt kép có thấu kính đặc biệt nhạy cảm với dải ánh sáng xanh 460nm do chính đồng loại phát ra."
      ];

      newC.weaknesses = [
        "Không có khả năng tấn công trực diện hoặc gây sát thương vật lý cho đối thủ.",
        "Tốc độ bơi rất chậm, phụ thuộc vào dòng chảy khi di chuyển xa.",
        "Số lượng dịch phát quang dịch chuyển dự trữ có hạn, cần ít nhất 24 giờ để tái tổng hợp đầy đủ sau khi cạn kiệt.",
        "Cực kỳ mẫn cảm trước sự thay đổi nồng độ muối và độ pH của nước biển ven bờ.",
        "Tỷ lệ sống sót và phát triển cực kỳ thấp khi cố gắng duy trì vòng đời trong môi trường nhân tạo.",
        "Dễ bị cuốn trôi hàng loạt bởi các dòng triều cường mạnh do sức bơi yếu ớt."
      ];

      newC.fun_facts = [
        "Trong Thế chiến thứ hai, binh lính Nhật Bản thu thập xác bọ giáp cổ sấy khô rồi nghiền nát với nước để tạo ra nguồn sáng dịu nhẹ cầm tay, giúp đọc bản đồ ban đêm mà không bị máy bay đối phương phát hiện.",
        "Chất luciferin của loài này cực kỳ bền, xác bọ khô có thể được bảo quản hàng chục năm vẫn sẽ phát sáng ngay lập tức khi tiếp xúc với nước ẩm.",
        "Con đực thường đồng loạt phun dịch sáng theo các nhịp điệu mã hóa độc nhất để thu hút con cái từ khoảng cách xa trong bóng tối.",
        "Sự phát quang của loài này đồng bộ đến mức hàng triệu con có thể phát sáng cùng lúc tạo ra những dải sóng xanh dương rực rỡ dọc bờ biển Nhật Bản khi có sóng vỗ cơ học.",
        "Cơ chế bài tiết vargulin qua môi trên của chúng được điều khiển bởi hệ thần kinh cholinergic nhạy bén."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1073/pnas.86.17.6567",
          "label": "PNAS - Cloning and expression of cDNA for the luciferase from the marine ostracod Vargula hilgendorfii"
        },
        {
          "url": "https://doi.org/10.1111/mec.15814",
          "label": "Molecular Ecology - Selection, drift, and constraint in cypridinid luciferases"
        },
        {
          "url": "https://doi.org/10.1016/j.jphotobiol.2018.04.017",
          "label": "Journal of Photochemistry and Photobiology - Vargula hilgendorfii bioluminescence mechanism"
        },
        {
          "url": "https://www.jstor.org/stable/2461947",
          "label": "The Biological Bulletin - Luminescent organs and secretions of Cypridina"
        }
      ];
    } else if (c.id === "cuvierian-sea-cucumber") {
      newC.diet_type = "detritivore";
      newC.diet_items = [
        "vụn hữu cơ đáy biển",
        "vi khuẩn đáy biển",
        "tảo đơn bào",
        "trùng lỗ"
      ];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản hữu tính. Thụ tinh ngoài nước. Con đực và con cái phóng tinh trùng và trứng trực tiếp vào nước biển vào mùa hè ấm áp. Trứng thụ tinh nở thành ấu trùng trôi nổi (auricularia) trước khi biến thái định cư xuống đáy biển.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.05;
      newC.conservation_status = "LC";
      newC.size_min_mm = 150;
      newC.size_max_mm = 250;
      newC.weight_avg_g = 300;

      newC.characteristics = "Thân hình trụ dài tựa như quả dưa chuột, bề mặt da dày nhám phủ đầy các gai thịt nhỏ màu xám, vàng nhạt hoặc nâu đen loang lổ. Mặt bụng có nhiều chân ống (tube feet) giúp bám chặt vào đá cát. Không có xương mà sử dụng áp suất thủy tĩnh để duy trì hình dạng cơ thể dẻo dai. Hệ thống ống Cuvierian trong khoang cơ thể chứa các protein tiền chất keo dính có cấu trúc xếp gấp β-sheet tương tự amyloid chức năng (functional amyloids). Lớp biểu mô ngoài của ống chứa các tế bào hạt xếp khít nhau sẵn sàng giải phóng chất nhầy keo.";
      newC.survival_method = "Sinh tồn bằng cách lọc cát bùn để ăn các vụn hữu cơ. Khi gặp nguy hiểm, chúng co thắt mạnh cơ thể và đẩy nước qua các cơ quan Cuvier ở gốc ruột, khiến các sợi ống Cuvierian màu trắng bắn vọt ra ngoài qua ngả hậu môn. Các sợi này ngay lập tức ngậm nước, kéo giãn gấp 20 lần và trở nên siêu dính như keo siêu lực, trói chặt chân cua, mỏ cá hoặc mang kẻ thù. Sợi chứa độc tố holothurin làm tê liệt thần kinh và hoại tử các tế bào của động vật nhỏ. Ngoài ra, chúng có khả năng độc đáo là hóa lỏng mô liên kết cơ thể (mutable collagenous tissue) để biến từ dạng cứng ngắc sang lỏng nhoét chui lọt qua kẽ đá hẹp rồi hóa cứng trở lại.";
      newC.unique_traits = "Cơ chế phóng tơ keo độc Cuvierian tubules từ hậu môn trói chặt kẻ thù. Khả năng hóa lỏng mô cơ thể dẻo dai (mutable collagenous tissue) để luồn lách kẽ đá. Tự tái sinh nội tạng bị mất trong vòng vài tuần. Khả năng chuyển trạng thái tức thì từ dịch lỏng sang chất keo bám dính siêu chắc dưới nước nhờ các liên kết hydro và cấu trúc sợi amyloid bền vững.";

      newC.strengths = [
        "Phóng tơ keo Cuvierian siêu dính kết hợp độc holothurin trói chặt và gây độc cho động vật săn mồi.",
        "Khả năng hóa lỏng cơ thể (mô liên kết biến tính) để chui lọt qua các kẽ nứt đá nhỏ hẹp nhất.",
        "Tốc độ tái sinh phi thường, có thể mọc lại toàn bộ nội tạng và ống phòng thủ trong vòng 2-4 tuần.",
        "Lớp da dày chứa các gai thịt có thể thay đổi độ cứng cơ học để chống chịu tác động vật lý mạnh.",
        "Khả năng trói chặt và vô hiệu hóa các loài cua, cá săn mồi kích thước lớn bằng mạng lưới sợi keo bám dính thủy lực.",
        "Độc tố holothurin có tính hướng màng mạnh mẽ, phá hủy lớp phospholipid trên tế bào mang cá gây ngạt thở.",
        "Độ bám dính siêu chắc dưới nước của tơ keo không bị suy giảm trong môi trường nước biển lạnh."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển bò trườn vô cùng chậm chạp, dễ bị bắt giữ nếu kẻ thù tránh được tơ keo.",
        "Không có vũ khí tấn công chủ động, hoàn toàn phụ thuộc vào phản xạ tự vệ thụ động.",
        "Việc phóng nội tạng phòng thủ tiêu hao cực kỳ nhiều năng lượng, cần nhiều tuần tĩnh dưỡng để phục hồi.",
        "Mất nhiều tuần để tái sinh lại toàn bộ hệ thống ống Cuvierian sau khi đã kích hoạt phóng ra tự vệ.",
        "Rất nhạy cảm với hiện tượng acid hóa đại dương làm suy yếu cấu trúc tế bào gai thịt ngoài da."
      ];

      newC.fun_facts = [
        "Sợi keo Cuvierian dính đến mức nếu dính vào tay người, cách duy nhất để gỡ ra mà không bị rát da là đợi sợi keo tự khô đi hoặc dùng cồn chà xát mạnh.",
        "Cơ chế hóa lỏng mô liên kết của hải sâm đang được các kỹ sư robot phẫu thuật nghiên cứu để chế tạo vật liệu thông minh tự thay đổi độ cứng.",
        "Hải sâm có thể hô hấp qua hậu môn bằng một cơ quan gọi là cây hô hấp (respiratory tree), thỉnh thoảng một số loài cá nhỏ (như cá ngọc trai) chui vào trong hậu môn hải sâm trú ẩn để tránh kẻ thù.",
        "Cấu trúc keo bám dính của hải sâm được làm từ 60% protein và 40% carbohydrate, có tính tương thích sinh học cao.",
        "Chất keo dính Cuvierian có thể bám chắc vào cả những bề mặt chống dính nổi tiếng như Teflon."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1116/1.4875731",
          "label": "Biointerphases - Instantaneous adhesion of Cuvierian tubules in the sea cucumber Holothuria forskali"
        },
        {
          "url": "https://doi.org/10.1007/s10126-002-0062-8",
          "label": "Marine Biotechnology - Characterization of the Adhesive from Cuvierian Tubules of Holothuria forskali"
        },
        {
          "url": "https://doi.org/10.1073/pnas.2217637120",
          "label": "PNAS - Expulsion and bioadhesive trap enriched with amyloid-patterned proteins in sea cucumbers"
        },
        {
          "url": "https://doi.org/10.1006/jmbi.1999.3023",
          "label": "Journal of Molecular Biology - Mutable collagenous tissue of sea cucumbers"
        }
      ];
    }

    return newC;
  });

  console.log(`Enriching ${enriched.length} creatures in database...`);
  for (const c of enriched) {
    const { error } = await supabase
      .from("creatures")
      .update({
        enrichment_count: c.enrichment_count,
        diet_type: c.diet_type,
        diet_items: c.diet_items,
        activity_pattern: c.activity_pattern,
        lifespan_min: c.lifespan_min,
        lifespan_max: c.lifespan_max,
        lifespan_unit: c.lifespan_unit,
        reproduction_type: c.reproduction_type,
        reproduction_notes: c.reproduction_notes,
        locomotion: c.locomotion,
        speed_max: c.speed_max,
        conservation_status: c.conservation_status,
        size_min_mm: c.size_min_mm,
        size_max_mm: c.size_max_mm,
        weight_avg_g: c.weight_avg_g,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        fun_facts: c.fun_facts,
        sources: c.sources,
        characteristics: c.characteristics,
        survival_method: c.survival_method,
        unique_traits: c.unique_traits
      })
      .eq("id", c.id);

    if (error) {
      console.error(`Error updating ${c.id}:`, error.message);
      process.exit(1);
    }
    console.log(`Updated ${c.name} (${c.id}) -> enrichment_count: ${c.enrichment_count}`);
  }
  console.log("Enrichment round completed successfully.");
}

run();
